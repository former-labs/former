import type { DatabaseMetadata, Integration, Table } from "./connections";

export interface IElectronAPI {
  database: {
    connect: (integration: Integration) => Promise<{ success: boolean; connectionId?: string; error?: string }>;
    disconnect: (connectionId: string) => Promise<void>;
    execute: (connectionId: string, query: string) => Promise<{
      jobId: string;
    }>;
    cancelJob: (connectionId: string, jobId: string) => Promise<void>;
    getJobResult: (connectionId: string, jobId: string) => Promise<{
      status: "complete";
      result: any[];
    } | {
      status: "error";
      error: string;
    } | {
      status: "canceled";
    }>;
    getProjectsAndDatasets: (connectionId: string) => Promise<DatabaseMetadata>;
    getTablesForDataset: (connectionId: string, datasetId: string, pageToken?: string) => Promise<{
      tables: Table[];
      nextPageToken?: string;
    }>;
    disconnectAll: () => Promise<void>;
  };
  send: (channel: string, data: unknown) => void;
  receive: (channel: string, func: (...args: unknown[]) => void) => void;
  on: (channel: string, func: (...args: unknown[]) => void) => void;
  store: {
    getIntegrations: () => Promise<Integration[]>;
    setIntegrations: (integrations: Integration[]) => Promise<void>;
    getActiveIntegrationId: () => Promise<string | null>;
    setActiveIntegrationId: (id: string | null) => Promise<void>;
  };
  openExternal: (url: string) => void;
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
