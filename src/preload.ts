import { contextBridge, ipcRenderer } from "electron";
import type { AlbumsPage, SizePref, DownloadImage } from "./app/types";

contextBridge.exposeInMainWorld("bulkflick", {
  version: "0.2.0",
  authStatus: () => ipcRenderer.invoke("auth:status") as Promise<{ token: boolean }>,
  login: () => ipcRenderer.invoke("auth:login") as Promise<{ ok: boolean; user?: any }>,
  logout: () => ipcRenderer.invoke("auth:logout") as Promise<{ ok: boolean }>,
  getAlbums: (page = 1, perPage = 24) =>
    ipcRenderer.invoke("flickr:getAlbums", { page, perPage }) as Promise<AlbumsPage>,
  getAlbumPhotos: (photosetId: string, size: SizePref) =>
    ipcRenderer.invoke("flickr:getAlbumPhotos", { photosetId, size }) as Promise<DownloadImage[]>
});
