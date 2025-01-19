import type { Project, Table } from "../../types/connections.js";

// Abstract base class for database connections
export abstract class Driver {
  protected credentials: any;

  constructor(credentials: any) {
    this.credentials = credentials;
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract executeQuery(query: string): Promise<any[]>;
  abstract getProjectId(): string;
  abstract getProjectName(): string;
  abstract fetchProjectsAndDatasets(): Promise<{
    projects: Project[];
  }>;
  abstract fetchTablesForDataset(datasetId: string, pageToken?: string): Promise<{
    tables: Table[];
    nextPageToken?: string;
  }>;
  abstract fetchDatasets(pageToken?: string): Promise<{
    datasets: Array<{ id: string; name: string }>;
    nextPageToken?: string;
  }>;
}
