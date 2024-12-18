import type { DatabaseMetadata, Integration } from "./connections";

export interface IElectronAPI {
  database: {
    connect: (integration: Integration) => Promise<{ success: boolean; connectionId?: string; error?: string }>;
    disconnect: (connectionId: string) => Promise<void>;
    execute: (connectionId: string, query: string) => Promise<unknown[]>;
    getMetadata: (connectionId: string) => Promise<DatabaseMetadata>;
  };
  send: (channel: string, data: unknown) => void;
  receive: (channel: string, func: (...args: unknown[]) => void) => void;
  store: {
    getIntegrations: () => Promise<Integration[]>;
    setIntegrations: (integrations: Integration[]) => Promise<void>;
    getActiveIntegrationId: () => Promise<string | null>;
    setActiveIntegrationId: (id: string | null) => Promise<void>;
  };
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