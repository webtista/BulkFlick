import { app, BrowserWindow, ipcMain, Menu } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensureLogin, getAlbums, getAlbumPhotos } from "./app/flickr.main.js";
import { readToken, clearToken } from "./app/secure-store.js";
import type { SizePref } from "./app/types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  Menu.setApplicationMenu(null);
  win.setMenuBarVisibility(false);

  await win.loadFile(path.join(app.getAppPath(), "public", "index.html"));

  if (!app.isPackaged) {
    win.webContents.openDevTools({ mode: "detach" });
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ===== IPC =====
ipcMain.handle("auth:status", async () => {
  return { token: readToken() != null };
});
ipcMain.handle("auth:login", async (e) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  const t = await ensureLogin(win || undefined);
  return { ok: true, user: { nsid: t.user_nsid, username: t.username, fullname: t.fullname } };
});
ipcMain.handle("auth:logout", async () => {
  clearToken();
  return { ok: true };
});

ipcMain.handle("flickr:getAlbums", async (_e, { page, perPage }: { page: number; perPage: number }) => {
  return await getAlbums(page, perPage);
});

ipcMain.handle("flickr:getAlbumPhotos", async (_e, { photosetId, size }: { photosetId: string; size: SizePref }) => {
  return await getAlbumPhotos(photosetId, size);
});
