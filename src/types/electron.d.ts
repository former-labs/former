import type { Integration, Project, Table } from "./connections";

export interface IElectronAPI {
  database: {
    connect: (integration: Integration) => Promise<{ success: boolean; connectionId?: string; error?: string }>;
    disconnect: (connectionId: string) => Promise<void>;
    execute: (connectionId: string, query: string) => Promise<unknown[]>;
    getProjectsAndDatasets: (connectionId: string) => Promise<{
      projects: Project[];
    }>;
    getTablesForDataset: (connectionId: string, datasetId: string, pageToken?: string) => Promise<{
      tables: Table[];
      nextPageToken?: string;
    }>;
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
