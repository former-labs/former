import { BigQuery, type JobCallback, type TableField } from "@google-cloud/bigquery";
import type { BigQueryCredentials, Field, Project, Table } from "../../types/connections.js";
import { Driver } from "./driver.js";

export class BigQueryDriver extends Driver {
  private client: BigQuery;
  private projectId: string;

  constructor(credentials: BigQueryCredentials, projectId: string) {
    super(credentials);
    this.projectId = projectId;
    this.client = new BigQuery({
      credentials: keysToSnakeCase(credentials, {}),
      projectId,
    });
  }

  async connect(): Promise<void> {
    // BigQuery client doesn't require explicit connection
  }

  async disconnect(): Promise<void> {
    // BigQuery client doesn't require explicit disconnection
  }

  async fetchDatasets(pageToken?: string): Promise<{
    datasets: Array<{
      id: string;
      name: string;
    }>;
    nextPageToken?: string;
  }> {
    const MAX_RESULTS_PER_PAGE = 10;
    
    const [datasets, , response] = await this.client.getDatasets({
      maxResults: MAX_RESULTS_PER_PAGE,
      pageToken,
    });

    return {
      datasets: datasets.map(dataset => ({
        id: dataset.id ?? 'unknown',
        name: dataset.id ?? 'unknown',
      })),
      nextPageToken: response?.nextPageToken,
    };
  }

  async fetchTablesForDataset(datasetId: string, pageToken?: string): Promise<{
    tables: Table[];
    nextPageToken?: string;
  }> {
    const MAX_RESULTS_PER_PAGE = 1000;
    const dataset = this.client.dataset(datasetId);
    
    const [tables, , response] = await dataset.getTables({
      maxResults: MAX_RESULTS_PER_PAGE,
      pageToken,
    });

    const parseField = (field: TableField): Field => ({
      name: field.name ?? '',
      type: field.type ?? '',
      description: field.description ?? null,
      ...(field.fields && { fields: field.fields.map(parseField) })
    });

    const tablesWithMetadata = await Promise.all(
      tables.map(async (table) => {
        const [metadata] = await table.getMetadata();
        if (!table.id) {
          throw new Error(`Table ID is undefined for dataset ${datasetId}`);
        }
        return {
          id: table.id,
          name: metadata.friendlyName ?? table.id,
          description: metadata.description ?? null,
          fields: metadata.schema.fields.map(parseField),
        };
      })
    );

    return {
      tables: tablesWithMetadata,
      nextPageToken: response?.nextPageToken,
    };
  }

  async executeQuery(query: string): Promise<{
    result: any[]
  } | {
    error: string;
  }> {
    try {
      const { job, err } = await new Promise<{
        job: Parameters<JobCallback>[1];
        err: null;
      } | {
        job: Parameters<JobCallback>[1];
        err: Parameters<JobCallback>[0];
      }>((resolve) => {
        this.client.createQueryJob({
          query,
          useLegacySql: false,
        }, (err, job) => {
          if (err) {
            resolve({ err, job });
          } else {
            // Assert job exists when no error
            if (!job) {
              throw new Error("Job does not exist while error does not exist");
            }
            resolve({ job, err: null });
          }
        });
      });

      if (err) {
        return { error: err.message };
      }

      const [rows] = await job!.getQueryResults();
      const result = rows.map(row => {
        const parsedRow: any = {};
        for (const key in row) {
          parsedRow[key] = this.parseValue(row[key]);
        }
        return parsedRow;
      });
      return { result };

    } catch (error) {
      console.error('Error executing BigQuery query:', error);
      throw error;
    }
  }

  private parseValue(value: any): any {
    if (typeof value === "object" && value?.hasOwnProperty("value")) {
      return value.value.toString();
    }
    return value;
  }

  getProjectId(): string {
    return this.projectId;
  }

  getProjectName(): string {
    return this.projectId;
  }

  async fetchProjectsAndDatasets(): Promise<{
    projects: Project[];
  }> {
    const projects: Project[] = [];

    const [datasets] = await this.client.getDatasets({
      maxResults: 10,
    });

    for (const dataset of datasets) {
      if (!dataset.projectId) {
        continue;
      }

      let projectIndex = projects.findIndex(p => p.id === dataset.projectId);
      if (projectIndex === -1) {
        projects.push({
          id: dataset.projectId,
          name: dataset.projectId,
          description: null,
          datasets: [],
        });
        projectIndex = projects.length - 1;
      }
      
      try {
        const [tables] = await this.client.dataset(dataset.id!).getTables();
        
        const project = projects[projectIndex];
        if (!project) {
          console.error(`Project at index ${projectIndex} not found, skipping dataset`);
          continue;
        }

        project.datasets.push({
          id: dataset.id ?? 'unknown',
          name: dataset.id ?? 'unknown',
          description: null,
          tableCount: tables.length,
          tables: []
        });
      } catch (error) {
        console.error(`Error processing dataset ${dataset.id}: ${error}`);
        continue;
      }
    }

    return { projects };
  }
}

// Helper function to convert object keys to snake_case
const toSnakeCase = (str: string): string => {
  return str
    .replace(/\.?([A-Z]+)/g, (x, y) => "_" + y.toLowerCase())
    .replace(/^_/, "");
};

const keysToSnakeCase = (
  obj: any,
  mappings: Record<string, string> = {}
): any => {
  if (Array.isArray(obj)) {
    return obj.map((v: any) => keysToSnakeCase(v, mappings));
  } else if (obj !== null && typeof obj === "object") {
    return Object.keys(obj).reduce((result, key) => {
      const mappedKey = toSnakeCase(mappings[key] ?? key);
      return {
        ...result,
        [mappedKey]: keysToSnakeCase(obj[key], mappings),
      };
    }, {});
  }
  return obj;
};
