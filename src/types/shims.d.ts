// Minimal type shims to satisfy the TypeScript compiler in environments
// where the real Node/Electron type packages are unavailable.
declare const process: {
  env: Record<string, string | undefined>;
  platform: string;
};

declare module "node:crypto" {
  const crypto: {
    createHmac(algorithm: string, key: string): {
      update(data: string): { digest(encoding: "base64"): string };
      digest(encoding: "base64"): string;
    };
    randomBytes(size: number): { toString(encoding: "hex"): string };
  };
  export default crypto;
}

declare module "node:fs" {
  const fs: {
    readFileSync(path: string, encoding: string): string;
    writeFileSync(path: string, data: string, encoding: string): void;
    mkdirSync(path: string, options: { recursive: boolean }): void;
    unlinkSync(path: string): void;
  };
  export default fs;
}

declare module "node:path" {
  const path: {
    join(...parts: string[]): string;
    dirname(path: string): string;
  };
  export default path;
}

declare module "node:url" {
  export function fileURLToPath(url: string): string;
  export class URLSearchParams {
    constructor(init?: Record<string, string> | string);
    append(name: string, value: string): void;
    entries(): IterableIterator<[string, string]>;
    toString(): string;
  }
}

declare module "electron" {
  export interface BrowserWindowConstructorOptions {
    width?: number;
    height?: number;
    parent?: BrowserWindow;
    modal?: boolean;
    title?: string;
    webPreferences?: Record<string, unknown>;
  }

  export interface WebRequest {
    onBeforeRequest(filter: unknown, listener?: (details: any) => void): void;
  }

  export class WebContents {
    getWebPreferences(): { partition?: string };
    openDevTools(options?: unknown): void;
    readonly session: {
      webRequest: WebRequest;
    };
  }

  export class BrowserWindow {
    constructor(options?: BrowserWindowConstructorOptions);
    static getAllWindows(): BrowserWindow[];
    static fromWebContents(contents: WebContents): BrowserWindow | null;
    loadURL(url: string): Promise<void>;
    loadFile(path: string): Promise<void>;
    removeMenu(): void;
    setMenuBarVisibility(visible: boolean): void;
    get webContents(): WebContents;
    close(): void;
    on(event: string, listener: (...args: unknown[]) => void): void;
  }

  export const app: {
    whenReady(): Promise<void>;
    on(event: string, listener: (...args: unknown[]) => void): void;
    getAppPath(): string;
    isPackaged: boolean;
    quit(): void;
    getPath(name: string): string;
  };

  export const session: {
    fromPartition(partition: string): {
      webRequest: WebRequest;
    };
  };

  export const Menu: {
    setApplicationMenu(menu: null): void;
  };

  export const ipcMain: {
    handle(channel: string, listener: (...args: any[]) => any): void;
  };

  export const contextBridge: {
    exposeInMainWorld(key: string, api: unknown): void;
  };

  export const ipcRenderer: {
    invoke(channel: string, ...args: unknown[]): Promise<unknown>;
  };
}
