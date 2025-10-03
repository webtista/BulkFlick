/**
 * @typedef {import("./app/types.js").Album} Album
 * @typedef {import("./app/types.js").AlbumsPage} AlbumsPage
 * @typedef {import("./app/types.js").SizePref} SizePref
 */

const $ = (sel) => document.querySelector(sel);
const getRequired = (sel) => {
  const el = $(sel);
  if (!el) throw new Error(`Missing element: ${sel}`);
  return el;
};

const welcome = getRequired("#welcome");
const appView = getRequired("#app");
const loginBtn = getRequired("#loginBtn");
const searchInput = /** @type {HTMLInputElement} */ (getRequired("#search"));
const searchBtn = getRequired("#searchBtn");
const albumsGrid = getRequired("#albumsGrid");
const albumsCount = getRequired("#albumsCount");
const downloadSelectedBtn = /** @type {HTMLButtonElement} */ (getRequired("#downloadSelected"));

const sizeRadio = () => {
  const selected = /** @type {HTMLInputElement|null} */ (
    document.querySelector('input[name="imgsize"]:checked')
  );
  return /** @type {SizePref} */ (selected?.value || "Small");
};

let currentPage = 1;
let totalPages = 1;
/** @type {Album[]} */
let albums = [];

const toggle = (el, show) => el.classList.toggle("hidden", !show);
const setCount = (page, pages, total) => {
  albumsCount.textContent = `Page ${page}/${pages} • ${total} total`;
};

const cardTemplate = (a) => {
  return `
  <article data-id="${a.id}" class="group rounded-2xl ring-1 ring-zinc-800 bg-zinc-900/50 overflow-hidden">
    <div class="aspect-[4/3] bg-zinc-800 overflow-hidden">
      <img src="${a.thumbUrl}" alt="" class="h-full w-full object-cover group-hover:opacity-90 transition-opacity">
    </div>
    <div class="p-3 grid gap-2">
      <h4 class="text-sm font-medium line-clamp-2">${a.title}</h4>
      <div class="flex items-center justify-between text-xs text-zinc-400">
        <span>${a.photoCount} photos</span>
        <button data-dl="${a.id}" class="rounded-lg px-2 py-1 bg-zinc-800 hover:bg-zinc-700 ring-1 ring-zinc-700">
          Download
        </button>
      </div>
    </div>
  </article>`;
};

const pagerTemplate = () => {
  return `
    <div class="col-span-full flex items-center justify-center gap-2 mt-1">
      <button id="prevPage" class="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 ring-1 ring-zinc-700" ${currentPage<=1?"disabled":""}>Prev</button>
      <span class="text-xs text-zinc-400">Page ${currentPage} / ${totalPages}</span>
      <button id="nextPage" class="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 ring-1 ring-zinc-700" ${currentPage>=totalPages?"disabled":""}>Next</button>
    </div>
  `;
};

/**
 * @param {AlbumsPage} albumsPage
 */
const render = (albumsPage) => {
  currentPage = albumsPage.page;
  totalPages = albumsPage.pages;
  albums = albumsPage.items;

  const grid = albums.map(cardTemplate).join("") + pagerTemplate();
  albumsGrid.innerHTML = grid;
  setCount(albumsPage.page, albumsPage.pages, albumsPage.total);
};

const api = window.bulkflick;

const refresh = async (page = 1) => {
  const res = await api.getAlbums(page, 12);
  render(res);
};

loginBtn.addEventListener("click", async () => {
  loginBtn.setAttribute("disabled", "true");
  loginBtn.textContent = "Opening Flickr…";
  try {
    await api.login();
    toggle(welcome, false);
    toggle(appView, true);
    await refresh(1);
  } catch (e) {
    alert("Login failed. Check console.");
    console.error(e);
  } finally {
    loginBtn.textContent = "Login with Flickr";
    loginBtn.removeAttribute("disabled");
  }
});

searchBtn.addEventListener("click", async () => {
  // For now, search is a refresh; later: call flickr.people.getPhotosets with primary filtering or text
  await refresh(1);
});

albumsGrid.addEventListener("click", async (e) => {
  const t = /** @type {HTMLElement} */ (e.target);
  if (t.id === "prevPage" && currentPage > 1) {
    await refresh(currentPage - 1);
    return;
  }
  if (t.id === "nextPage" && currentPage < totalPages) {
    await refresh(currentPage + 1);
    return;
  }

  const btn = t.closest("[data-dl]");
  if (!(btn instanceof HTMLElement)) return;

  const id = btn.getAttribute("data-dl");
  if (!id) return;
  btn.setAttribute("disabled", "true");
  btn.classList.add("opacity-60");
  btn.textContent = "Fetching…";
  try {
    const urls = await api.getAlbumPhotos(id, sizeRadio());
    console.log("Album URLs", urls);
    // TODO: queue real downloads via IPC (filesystem). For now, just notify count:
    btn.textContent = `Got ${urls.length} URLs`;
    setTimeout(() => { btn.textContent = "Download"; btn.classList.remove("opacity-60"); btn.removeAttribute("disabled"); }, 1200);
  } catch (err) {
    console.error(err);
    btn.textContent = "Error";
    setTimeout(() => { btn.textContent = "Download"; btn.classList.remove("opacity-60"); btn.removeAttribute("disabled"); }, 1200);
  }
});

downloadSelectedBtn.addEventListener("click", () => {
  alert("Select albums via future multi-select, then batch download (TODO).");
});

// Auto-reveal app if already logged in
(async () => {
  const st = await api.authStatus();
  if (st.token) {
    toggle(welcome, false);
    toggle(appView, true);
    await refresh(1);
  }
})();
