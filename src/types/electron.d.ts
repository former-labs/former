import type { Integration } from '@/contexts/DataContext';
import type { DatabaseConfig, DatabaseMetadata } from "./connections";

export interface IElectronAPI {
  database: {
    connect: (config: DatabaseConfig) => Promise<{ success: boolean; connectionId?: string; error?: string }>;
    disconnect: (connectionId: string) => Promise<void>;
    execute: (connectionId: string, query: string) => Promise<unknown[]>;
    getMetadata: (connectionId: string) => Promise<DatabaseMetadata>;
  };
  send: (channel: string, data: unknown) => void;
  receive: (channel: string, func: (...args: unknown[]) => void) => void;
  store: {
    getIntegrations: () => Integration[];
    setIntegrations: (integrations: Integration[]) => void;
    getActiveIntegrationId: () => string | null;
    setActiveIntegrationId: (id: string | null) => void;
  };
}

export type Integration = typeof Integration;

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