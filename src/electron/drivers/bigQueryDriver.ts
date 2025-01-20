import { BigQuery, type Job, type JobCallback, type TableField } from "@google-cloud/bigquery";
import type { BigQueryCredentials, Field, Project, Table } from "../../types/connections.js";
import { Driver } from "./driver.js";

export class BigQueryDriver extends Driver {
  private client: BigQuery;
  private projectId: string;
  private jobs: Map<string, {
    complete: boolean;
    job: Job;
    error?: string;
  }>;

  constructor(credentials: BigQueryCredentials, projectId: string) {
    super(credentials);
    this.projectId = projectId;
    this.client = new BigQuery({
      credentials: keysToSnakeCase(credentials, {}),
      projectId,
    });
    this.jobs = new Map();
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
    jobId: string;
  }> {
    try {
      const { job, err } = await new Promise<{
        job: Job;
        err: null;
      } | {
        job: Job;
        err: NonNullable<Parameters<JobCallback>[0]>;
      }>((resolve) => {
        this.client.createQueryJob({
          query,
          useLegacySql: false,
        }, (err, job) => {
          // Assert job exists when no error
          if (!job) {
            throw new Error("Job does not exist");
          }

          if (err) {
            resolve({ err, job });
          } else {
            resolve({ job, err: null });
          }
        });
      });

      const jobId = job.id;
      if (!jobId) {
        throw new Error("Job ID is undefined");
      }

      if (err) {
        this.jobs.set(jobId, {
          complete: true,
          job,
          error: err.message
        });
      } else {
        this.jobs.set(jobId, {
          complete: false,
          job,
          error: undefined,
        });
      }

      return { jobId };

    } catch (error) {
      console.error('Error executing BigQuery query:', error);
      throw error;
    }
  }

  async cancelJob(jobId: string): Promise<void> {
    const jobInfo = this.jobs.get(jobId);
    if (!jobInfo) {
      throw new Error(`Job ${jobId} not found`);
    }
    await jobInfo.job.cancel();
  }

  async getJobResult(jobId: string): Promise<{
    result: any[];
  } | {
    error: string;
  }> {
    const jobInfo = this.jobs.get(jobId);
    if (!jobInfo) {
      return { error: `Job ${jobId} not found` };
    }

    if (jobInfo.error) {
      return { error: jobInfo.error };
    }

    const [rows] = await jobInfo.job.getQueryResults();
    const result = rows.map(row => {
      const parsedRow: any = {};
      for (const key in row) {
        parsedRow[key] = this.parseValue(row[key]);
      }
      return parsedRow;
    });
    jobInfo.complete = true;
    return { result };
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
