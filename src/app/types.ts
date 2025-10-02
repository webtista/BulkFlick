export type OAuthToken = {
  oauth_token: string;
  oauth_token_secret: string;
  user_nsid?: string;
  username?: string;
  fullname?: string;
};

export type Album = {
  id: string;
  title: string;
  photoCount: number;
  primaryPhotoId: string;
  thumbUrl: string;
};

export type AlbumsPage = {
  page: number;
  pages: number;
  perPage: number;
  total: number;
  items: Album[];
};

export type SizePref = "Small" | "Medium" | "Large" | "Original";

export type DownloadImage = {
  id: string;
  title?: string;
  bestUrl: string;
};

export type Settings = {
  size: SizePref;
  downloadDir: string;
};

export type FlickrSecrets = {
  apiKey: string;
  apiSecret: string;
};
