export interface IElectronAPI {
  database: {
    connect: (config: unknown) => Promise<{ success: boolean; connectionId?: string; error?: string }>;
    disconnect: (connectionId: string) => Promise<void>;
    execute: (connectionId: string, query: string) => Promise<unknown[]>;
    getMetadata: (connectionId: string) => Promise<unknown>;
  };
  send: (channel: string, data: unknown) => void;
  receive: (channel: string, func: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    electron: IElectronAPI;
  }
}

declare module 'dotenv' {
  export function config(options?: {
    path?: string;
    encoding?: string;
    debug?: boolean;
    override?: boolean;
  }): void;
}