import fs from "node:fs";
import path from "node:path";
import { app } from "electron";

/** @typedef {import("./types.js").OAuthToken} OAuthToken */

const file = path.join(app.getPath("userData"), "auth.json");

/**
 * @returns {OAuthToken | null}
 */
export function readToken() {
  try {
    const raw = fs.readFileSync(file, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * @param {OAuthToken} token
 */
export function writeToken(token) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(token, null, 2), "utf8");
}

export function clearToken() {
  try { fs.unlinkSync(file); } catch {}
}
