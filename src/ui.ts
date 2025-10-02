// Minimal UI interactivity + placeholders to wire into Electron + Flickr later.

type Album = {
  id: string;
  title: string;
  thumbUrl: string;
  photoCount?: number;
};

const loginBtn = document.getElementById("loginBtn") as HTMLButtonElement;
const fetchAlbumsBtn = document.getElementById("fetchAlbumsBtn") as HTMLButtonElement;
const userInput = document.getElementById("userInput") as HTMLInputElement;
const albumsGrid = document.getElementById("albumsGrid") as HTMLDivElement;
const albumCount = document.getElementById("albumCount") as HTMLSpanElement;
const emptyState = document.getElementById("emptyState") as HTMLDivElement;

// Settings
const settingsToggle = document.getElementById("settingsToggle") as HTMLButtonElement;
const settingsPanel = document.getElementById("settingsPanel") as HTMLDivElement;
const settingsBackdrop = document.getElementById("settingsBackdrop") as HTMLDivElement;
const settingsContent = document.getElementById("settingsContent") as HTMLDivElement;
const settingsClose = document.getElementById("settingsClose") as HTMLButtonElement;
const sizeButtons = Array.from(document.querySelectorAll<HTMLButtonElement>(".sizeBtn"));
const currentSize = document.getElementById("currentSize") as HTMLSpanElement;
const chooseFolderBtn = document.getElementById("chooseFolderBtn") as HTMLButtonElement;
const folderPath = document.getElementById("folderPath") as HTMLSpanElement;
const saveSettingsBtn = document.getElementById("saveSettingsBtn") as HTMLButtonElement;

// Footer year
document.getElementById("year")!.textContent = String(new Date().getFullYear());

// --- State (persist later via Electron Store if desired) ---
const state = {
  loggedIn: false,
  imageSize: "Medium" as "Small" | "Medium" | "Large" | "Original",
  downloadFolder: "" as string,
  albums: [] as Album[],
};

// --- Flickr/Electron placeholders ---
async function authorizeWithFlickr(): Promise<void> {
  // Hook this up to your OAuth flow (Electron main via IPC).
  // Example: await window.api.oauth.flickrLogin()
  console.log("Auth: start Flickr OAuth flow");
}

async function pickDownloadFolder(): Promise<string> {
  // Hook to Electron dialog: return await window.api.selectFolder()
  console.log("Folder: opening dialog…");
  return ""; // return selected path
}

async function fetchUserAlbums(query: string): Promise<Album[]> {
  // Replace this mock with real Flickr API calls
  // Example endpoint: flickr.photosets.getList
  await new Promise((r) => setTimeout(r, 400));
  if (!query.trim()) return [];
  return Array.from({ length: 9 }).map((_, i) => ({
    id: `album-${i + 1}`,
    title: `Sample Album ${i + 1}`,
    thumbUrl: `https://picsum.photos/seed/album-${i + 1}/600/400`,
    photoCount: 20 + i,
  }));
}

function humanSizeLabel(size: Album["id"]) {
  return size;
}

// --- UI helpers ---
function renderAlbums(list: Album[]) {
  albumsGrid.innerHTML = "";
  albumCount.textContent = String(list.length);
  emptyState.classList.toggle("hidden", list.length !== 0);

  list.forEach((a) => {
    const card = document.createElement("article");
    card.className =
      "group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-shadow hover:shadow-md";

    card.innerHTML = `
      <div class="aspect-[4/3] overflow-hidden bg-neutral-100">
        <img src="${a.thumbUrl}" alt="${a.title}" class="h-full w-full object-cover transition-[scale] duration-300 group-hover:scale-105" />
      </div>
      <div class="space-y-2 p-4">
        <div class="flex items-start justify-between gap-3">
          <h3 class="line-clamp-2 text-sm font-medium">${a.title}</h3>
          <span class="shrink-0 rounded-lg bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600">${a.photoCount ?? "—"} photos</span>
        </div>
        <button
          data-album-id="${a.id}"
          class="downloadAlbum inline-flex w-full items-center justify-center rounded-xl bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500">
          Download Album
        </button>
      </div>
    `;

    albumsGrid.appendChild(card);
  });

  // Bind download buttons
  albumsGrid.querySelectorAll<HTMLButtonElement>(".downloadAlbum").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-album-id")!;
      const album = state.albums.find((x) => x.id === id);
      if (!album) return;
      // Wire to Electron main: window.api.downloadAlbum({ id, size: state.imageSize, folder: state.downloadFolder })
      console.log("Download:", { id, size: state.imageSize, folder: state.downloadFolder || "(not set)" });
    });
  });
}

// --- Settings drawer behavior ---
function openSettings() {
  settingsPanel.classList.remove("hidden");
  requestAnimationFrame(() => {
    settingsPanel.classList.remove("pointer-events-none");
    settingsBackdrop.classList.remove("opacity-0");
    settingsContent.classList.remove("translate-x-full");
    settingsToggle.setAttribute("aria-expanded", "true");
  });
}

function closeSettings() {
  settingsPanel.classList.add("pointer-events-none");
  settingsBackdrop.classList.add("opacity-0");
  settingsContent.classList.add("translate-x-full");
  settingsToggle.setAttribute("aria-expanded", "false");
  // wait for transition then hide
  setTimeout(() => settingsPanel.classList.add("hidden"), 200);
}

settingsToggle.addEventListener("click", () => openSettings());
settingsClose.addEventListener("click", () => closeSettings());
settingsBackdrop.addEventListener("click", () => closeSettings());
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeSettings();
});

// Image size selection
function updateSizeButtons() {
  sizeButtons.forEach((b) => {
    const pressed = b.dataset.size === state.imageSize;
    b.setAttribute("aria-pressed", String(pressed));
  });
  currentSize.textContent = state.imageSize;
}
sizeButtons.forEach((b) =>
  b.addEventListener("click", () => {
    state.imageSize = (b.dataset.size as typeof state.imageSize) ?? state.imageSize;
    updateSizeButtons();
  })
);
updateSizeButtons();

// Folder selection
chooseFolderBtn.addEventListener("click", async () => {
  const path = await pickDownloadFolder();
  if (path) {
    state.downloadFolder = path;
    folderPath.textContent = path;
  }
});

// Save settings
saveSettingsBtn.addEventListener("click", () => {
  // Persist via Electron store if desired
  console.log("Settings saved", {
    size: state.imageSize,
    folder: state.downloadFolder || "(not set)",
  });
  closeSettings();
});

// Login
loginBtn.addEventListener("click", async () => {
  await authorizeWithFlickr();
  state.loggedIn = true; // set after success
});

// Search interactions
fetchAlbumsBtn.addEventListener("click", async () => {
  await handleFetch();
});
userInput.addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    await handleFetch();
  }
});

async function handleFetch() {
  const q = userInput.value;
  const results = await fetchUserAlbums(q);
  state.albums = results;
  renderAlbums(results);
}

// Initial UI
renderAlbums([]);
