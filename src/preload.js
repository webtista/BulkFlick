import { contextBridge, ipcRenderer } from "electron";

/**
 * @typedef {import("./app/types.js").AlbumsPage} AlbumsPage
 * @typedef {import("./app/types.js").SizePref} SizePref
 * @typedef {import("./app/types.js").DownloadImage} DownloadImage
 */

contextBridge.exposeInMainWorld("bulkflick", {
  version: "0.2.0",
  /** @returns {Promise<{ token: boolean }>} */
  authStatus: () => ipcRenderer.invoke("auth:status"),
  /** @returns {Promise<{ ok: boolean, user?: any }>} */
  login: () => ipcRenderer.invoke("auth:login"),
  /** @returns {Promise<{ ok: boolean }>} */
  logout: () => ipcRenderer.invoke("auth:logout"),
  /**
   * @param {number} [page]
   * @param {number} [perPage]
   * @returns {Promise<AlbumsPage>}
   */
  getAlbums: (page = 1, perPage = 24) => ipcRenderer.invoke("flickr:getAlbums", { page, perPage }),
  /**
   * @param {string} photosetId
   * @param {SizePref} size
   * @returns {Promise<DownloadImage[]>}
   */
  getAlbumPhotos: (photosetId, size) => ipcRenderer.invoke("flickr:getAlbumPhotos", { photosetId, size })
});
