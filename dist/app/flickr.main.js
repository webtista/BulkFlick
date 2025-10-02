import crypto from "node:crypto";
import { BrowserWindow, session } from "electron";
import { URLSearchParams } from "node:url";
import { readToken, writeToken } from "./secure-store.js";
// ====== CONFIG ======
const CALLBACK_SCHEME = "bulkflick://auth";
const FLICKR_BASE = "https://www.flickr.com/services";
const REST = "https://api.flickr.com/services/rest/";
// NOTE: Put your keys here for local dev; later load from env/secure store.
const FLICKR = {
    apiKey: process.env.FLICKR_API_KEY ?? "4718b07806e88233ce47ee5f53e744be",
    apiSecret: process.env.FLICKR_API_SECRET ?? "7d2806f617398732"
};
// ====== OAuth 1.0a utils ======
function percent(v) {
    return encodeURIComponent(v).replace(/[!*()']/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}
function baseString(method, url, params) {
    const normalized = Object.keys(params)
        .sort()
        .map(k => `${percent(k)}=${percent(params[k])}`)
        .join("&");
    return [method.toUpperCase(), percent(url), percent(normalized)].join("&");
}
function sign(method, url, params, consumerSecret, tokenSecret = "") {
    const key = `${percent(consumerSecret)}&${percent(tokenSecret)}`;
    const text = baseString(method, url, params);
    return crypto.createHmac("sha1", key).update(text).digest("base64");
}
function oauthParams(extra = {}) {
    return {
        oauth_consumer_key: FLICKR.apiKey,
        oauth_nonce: crypto.randomBytes(16).toString("hex"),
        oauth_signature_method: "HMAC-SHA1",
        oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
        oauth_version: "1.0",
        ...extra
    };
}
function toQuery(obj) {
    const q = new URLSearchParams();
    Object.entries(obj).forEach(([k, v]) => {
        if (v === undefined)
            return;
        q.append(k, String(v));
    });
    return q.toString();
}
// ====== OAuth Flow ======
export async function ensureLogin(parent) {
    const existing = readToken();
    if (existing?.oauth_token && existing?.oauth_token_secret)
        return existing;
    // 1) Get request token
    const reqUrl = `${FLICKR_BASE}/oauth/request_token`;
    const reqParams = oauthParams({ oauth_callback: CALLBACK_SCHEME });
    const reqSig = sign("GET", reqUrl, reqParams, FLICKR.apiSecret);
    const reqQuery = toQuery({ ...reqParams, oauth_signature: reqSig });
    const reqResp = await fetch(`${reqUrl}?${reqQuery}`);
    const reqText = await reqResp.text();
    const reqData = Object.fromEntries(new URLSearchParams(reqText).entries());
    const oauth_token = reqData["oauth_token"];
    const oauth_token_secret = reqData["oauth_token_secret"];
    if (!oauth_token || !oauth_token_secret)
        throw new Error("Failed to obtain request token");
    // 2) Open authorize window
    const authUrl = `${FLICKR_BASE}/oauth/authorize?${toQuery({
        oauth_token,
        perms: "read"
    })}`;
    const popup = new BrowserWindow({
        parent,
        modal: true,
        width: 720,
        height: 820,
        title: "Flickr Login",
        webPreferences: { sandbox: true }
    });
    popup.removeMenu?.();
    await popup.loadURL(authUrl);
    const ses = session.fromPartition(popup.webContents.getWebPreferences().partition || "");
    const verifier = await new Promise((resolve, reject) => {
        const handler = (details) => {
            if (details.url.startsWith(CALLBACK_SCHEME)) {
                const url = new URL(details.url);
                const v = url.searchParams.get("oauth_verifier");
                // clean up listeners
                ses.webRequest.onBeforeRequest(null);
                resolve(v || "");
                popup.close();
            }
        };
        ses.webRequest.onBeforeRequest({ urls: [CALLBACK_SCHEME + "*"] }, handler);
        popup.on("closed", () => reject(new Error("Auth window closed")));
    });
    if (!verifier)
        throw new Error("No oauth_verifier returned");
    // 3) Exchange for access token
    const accUrl = `${FLICKR_BASE}/oauth/access_token`;
    const accParams = oauthParams({ oauth_token, oauth_verifier: verifier });
    const accSig = sign("GET", accUrl, accParams, FLICKR.apiSecret, oauth_token_secret);
    const accQuery = toQuery({ ...accParams, oauth_signature: accSig });
    const accResp = await fetch(`${accUrl}?${accQuery}`);
    const accText = await accResp.text();
    const acc = Object.fromEntries(new URLSearchParams(accText).entries());
    const token = {
        oauth_token: acc["oauth_token"],
        oauth_token_secret: acc["oauth_token_secret"],
        user_nsid: acc["user_nsid"],
        username: acc["username"],
        fullname: acc["fullname"]
    };
    if (!token.oauth_token || !token.oauth_token_secret)
        throw new Error("Failed to obtain access token");
    writeToken(token);
    return token;
}
// ====== Signed REST requests ======
async function flickr(method, params) {
    const token = readToken();
    if (!token)
        throw new Error("Not authenticated");
    const baseParams = {
        method,
        api_key: FLICKR.apiKey,
        format: "json",
        nojsoncallback: "1",
        ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
    };
    const all = {
        ...oauthParams({ oauth_token: token.oauth_token }),
        ...baseParams
    };
    const sig = sign("GET", REST, all, FLICKR.apiSecret, token.oauth_token_secret);
    const url = `${REST}?${toQuery({ ...all, oauth_signature: sig })}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.stat !== "ok")
        throw new Error(data.message || "Flickr API error");
    return data;
}
// ====== High-level API ======
export async function getAlbums(page = 1, perPage = 24) {
    const token = readToken();
    if (!token?.user_nsid)
        await ensureLogin();
    const data = await flickr("flickr.photosets.getList", {
        user_id: token.user_nsid,
        page,
        per_page: perPage
    });
    const sets = data.photosets.photoset;
    // Fetch a small thumbnail for each album via primary photo
    const items = [];
    for (const s of sets) {
        const primary = s.primary;
        const info = await flickr("flickr.photos.getInfo", { photo_id: primary });
        const p = info.photo;
        // Construct a small thumbnail (q = 150 square) using size suffix when available
        // If url_q is not in getInfo, call getSizes to be safe:
        const sizes = await flickr("flickr.photos.getSizes", { photo_id: primary });
        const q = sizes.sizes.size.find((x) => x.label === "Large Square" || x.label === "Large 150");
        const thumb = q?.source ?? (sizes.sizes.size[0]?.source ?? "");
        items.push({
            id: s.id,
            title: s.title._content,
            photoCount: Number(s.photos),
            primaryPhotoId: primary,
            thumbUrl: thumb
        });
    }
    return {
        page: Number(data.photosets.page),
        pages: Number(data.photosets.pages),
        perPage: Number(data.photosets.perpage),
        total: Number(data.photosets.total),
        items
    };
}
export async function getAlbumPhotos(photosetId, sizePref) {
    // Pull all photos (iterate pages if needed)
    let page = 1;
    const per_page = 500;
    const result = [];
    do {
        const data = await flickr("flickr.photosets.getPhotos", {
            photoset_id: photosetId,
            page,
            per_page,
            extras: "url_o,url_k,url_h,url_l,url_c,url_z,url_m,url_q"
        });
        const photos = data.photoset.photo;
        for (const p of photos) {
            const best = pickBestUrl(p, sizePref);
            if (best)
                result.push({ id: p.id, title: p.title, bestUrl: best });
        }
        const pages = Number(data.photoset.pages);
        if (page >= pages)
            break;
        page += 1;
    } while (true);
    return result;
}
function pickBestUrl(p, pref) {
    // Preference mapping by Flickr's size list; fall back gracefully.
    const orderByPref = {
        Small: ["url_m", "url_z", "url_c", "url_l", "url_o"],
        Medium: ["url_z", "url_c", "url_l", "url_o", "url_m"],
        Large: ["url_l", "url_h", "url_k", "url_o", "url_c"],
        Original: ["url_o", "url_k", "url_h", "url_l", "url_c", "url_z", "url_m"]
    };
    const candidates = orderByPref[pref];
    for (const k of candidates) {
        if (p[k])
            return p[k];
    }
    return undefined;
}
