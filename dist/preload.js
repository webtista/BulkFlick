import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("bulkflick", {
    version: "0.2.0",
    authStatus: () => ipcRenderer.invoke("auth:status"),
    login: () => ipcRenderer.invoke("auth:login"),
    logout: () => ipcRenderer.invoke("auth:logout"),
    getAlbums: (page = 1, perPage = 24) => ipcRenderer.invoke("flickr:getAlbums", { page, perPage }),
    getAlbumPhotos: (photosetId, size) => ipcRenderer.invoke("flickr:getAlbumPhotos", { photosetId, size })
});
