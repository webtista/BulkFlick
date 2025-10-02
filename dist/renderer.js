const $ = (sel) => document.querySelector(sel);
const welcome = $("#welcome");
const appView = $("#app");
const loginBtn = $("#loginBtn");
const searchInput = $("#search");
const searchBtn = $("#searchBtn");
const albumsGrid = $("#albumsGrid");
const albumsCount = $("#albumsCount");
const downloadSelectedBtn = $("#downloadSelected");
const sizeRadio = () => (document.querySelector('input[name="imgsize"]:checked')?.value ?? "Small");
let currentPage = 1;
let totalPages = 1;
let albums = [];
function toggle(el, show) { el.classList.toggle("hidden", !show); }
function setCount(page, pages, total) {
    albumsCount.textContent = `Page ${page}/${pages} • ${total} total`;
}
function cardTemplate(a) {
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
}
function pagerTemplate() {
    return `
    <div class="col-span-full flex items-center justify-center gap-2 mt-1">
      <button id="prevPage" class="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 ring-1 ring-zinc-700" ${currentPage <= 1 ? "disabled" : ""}>Prev</button>
      <span class="text-xs text-zinc-400">Page ${currentPage} / ${totalPages}</span>
      <button id="nextPage" class="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 ring-1 ring-zinc-700" ${currentPage >= totalPages ? "disabled" : ""}>Next</button>
    </div>
  `;
}
function render(albumsPage) {
    currentPage = albumsPage.page;
    totalPages = albumsPage.pages;
    albums = albumsPage.items;
    const grid = albums.map(cardTemplate).join("") + pagerTemplate();
    albumsGrid.innerHTML = grid;
    setCount(albumsPage.page, albumsPage.pages, albumsPage.total);
}
async function refresh(page = 1) {
    const res = await window.bulkflick.getAlbums(page, 12);
    render(res);
}
loginBtn?.addEventListener("click", async () => {
    loginBtn.setAttribute("disabled", "true");
    loginBtn.textContent = "Opening Flickr…";
    try {
        await window.bulkflick.login();
        toggle(welcome, false);
        toggle(appView, true);
        await refresh(1);
    }
    catch (e) {
        alert("Login failed. Check console.");
        console.error(e);
    }
    finally {
        loginBtn.textContent = "Login with Flickr";
        loginBtn.removeAttribute("disabled");
    }
});
searchBtn?.addEventListener("click", async () => {
    // For now, search is a refresh; later: call flickr.people.getPhotosets with primary filtering or text
    await refresh(1);
});
albumsGrid?.addEventListener("click", async (e) => {
    const t = e.target;
    if (t.id === "prevPage" && currentPage > 1) {
        await refresh(currentPage - 1);
        return;
    }
    if (t.id === "nextPage" && currentPage < totalPages) {
        await refresh(currentPage + 1);
        return;
    }
    const btn = t.closest("[data-dl]");
    if (!btn)
        return;
    const id = btn.getAttribute("data-dl");
    btn.setAttribute("disabled", "true");
    btn.classList.add("opacity-60");
    btn.textContent = "Fetching…";
    try {
        const urls = await window.bulkflick.getAlbumPhotos(id, sizeRadio());
        console.log("Album URLs", urls);
        // TODO: queue real downloads via IPC (filesystem). For now, just notify count:
        btn.textContent = `Got ${urls.length} URLs`;
        setTimeout(() => { btn.textContent = "Download"; btn.classList.remove("opacity-60"); btn.removeAttribute("disabled"); }, 1200);
    }
    catch (err) {
        console.error(err);
        btn.textContent = "Error";
        setTimeout(() => { btn.textContent = "Download"; btn.classList.remove("opacity-60"); btn.removeAttribute("disabled"); }, 1200);
    }
});
downloadSelectedBtn?.addEventListener("click", () => {
    alert("Select albums via future multi-select, then batch download (TODO).");
});
// Auto-reveal app if already logged in
(async () => {
    const st = await window.bulkflick.authStatus();
    if (st.token) {
        toggle(welcome, false);
        toggle(appView, true);
        await refresh(1);
    }
})();
export {};
