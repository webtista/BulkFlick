import type { AlbumsPage, DownloadImage, SizePref } from "../app/types";

declare global {
  interface Window {
    bulkflick: {
      version: string;
      authStatus: () => Promise<{ token: boolean }>;
      login: () => Promise<{ ok: boolean; user?: unknown }>;
      logout: () => Promise<{ ok: boolean }>;
      getAlbums: (page?: number, perPage?: number) => Promise<AlbumsPage>;
      getAlbumPhotos: (photosetId: string, size: SizePref) => Promise<DownloadImage[]>;
    };
  }
}

export {};
