import type { DatabaseConfig, WarehouseMetadata } from "./connections";

export interface IElectronAPI {
  database: {
    connect: (config: DatabaseConfig) => Promise<{ success: boolean; connectionId?: string; error?: string }>;
    disconnect: (connectionId: string) => Promise<void>;
    execute: (connectionId: string, query: string) => Promise<unknown[]>;
    getMetadata: (connectionId: string) => Promise<WarehouseMetadata>;
  };
  send: (channel: string, data: unknown) => void;
  receive: (channel: string, func: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    electron: IElectronAPI;
  }
} 