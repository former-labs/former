import { BigQuery, type TableField } from "@google-cloud/bigquery";
import pkg from 'pg';
import type { BigQueryCredentials, DatabaseCredentials, PostgresCredentials, Project, Table } from "../../types/connections.js";
const { Client } = pkg;


// Helper function to convert object keys to snake_case
const toSnakeCase = (str: string): string => {
  return str
    .replace(/\.?([A-Z]+)/g, (x, y) => "_" + y.toLowerCase())
    .replace(/^_/, "");
};

export const keysToSnakeCase = (
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

    const parseField = (field: TableField): {
      name: string;
      type: string;
      description: string | null;
      fields?: Array<{
        name: string;
        type: string;
        description: string | null;
        fields?: Array<any>;
      }>;
    } => ({
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

  async executeQuery(query: string): Promise<any[]> {
    try {
      const [job] = await this.client.createQueryJob({
        query,
        useLegacySql: false,
      });

      const [rows] = await job.getQueryResults();
      return rows.map(row => {
        const parsedRow: any = {};
        for (const key in row) {
          parsedRow[key] = this.parseValue(row[key]);
        }
        return parsedRow;
      });
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
      
      // Get table count for this dataset
      const [tables] = await this.client.dataset(dataset.id!).getTables();
      
      projects[projectIndex].datasets.push({
        id: dataset.id ?? 'unknown',
        name: dataset.id ?? 'unknown',
        description: null,
        tableCount: tables.length,
        tables: []
      });
    }

    return { projects };
  }
}

export class PostgresDriver extends Driver {
  private client: any;

  constructor(credentials: PostgresCredentials) {
    super(credentials);
    this.client = new Client({
      host: credentials.host,
      port: credentials.port,
      database: credentials.database,
      user: credentials.user,
      password: credentials.password,
    });
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    await this.client.end();
  }

  async fetchProjectsAndDatasets(): Promise<{
    projects: Project[];
  }> {
    const result = await this.client.query(
      `SELECT 
        s.schema_name as id,
        COUNT(t.table_name) as table_count
       FROM information_schema.schemata s
       LEFT JOIN information_schema.tables t 
         ON t.table_schema = s.schema_name
       WHERE s.schema_name NOT IN ('information_schema', 'pg_catalog')
       GROUP BY s.schema_name`
    );

    // Create a single project (the database) with schemas as datasets
    const project: Project = {
      id: this.getProjectId(),
      name: this.getProjectName(),
      description: null,
      datasets: result.rows.map((schema: { id: string; table_count: string }) => ({
        id: schema.id,
        name: schema.id,
        description: null,
        tableCount: parseInt(schema.table_count, 10),
        tables: []
      }))
    };

    return { projects: [project] };
  }

  async fetchTablesForDataset(datasetId: string): Promise<{
    tables: Table[];
    nextPageToken?: string;
  }> {
    const result = await this.client.query(
      `SELECT 
        t.table_name,
        c.column_name,
        c.data_type,
        col_description(format('%I.%I', t.table_schema, t.table_name)::regclass::oid, c.ordinal_position) as description
      FROM information_schema.tables t
      JOIN information_schema.columns c 
        ON t.table_schema = c.table_schema 
        AND t.table_name = c.table_name
      WHERE t.table_schema = $1`,
      [datasetId]
    );

    const tables = new Map();
    for (const row of result.rows) {
      if (!tables.has(row.table_name)) {
        tables.set(row.table_name, {
          id: row.table_name,
          name: row.table_name,
          description: row.description,
          fields: []
        });
      }
      tables.get(row.table_name).fields.push({
        name: row.column_name,
        type: row.data_type,
        description: row.description || null,
      });
    }

    return {
      tables: Array.from(tables.values()),
      nextPageToken: undefined
    };
  }

  getProjectId(): string {
    return this.credentials.database;
  }

  getProjectName(): string {
    return this.credentials.database;
  }

  async fetchDatasets(): Promise<{
    datasets: Array<{ id: string; name: string }>;
    nextPageToken?: string;
  }> {
    const result = await this.client.query(
      `SELECT schema_name as id FROM information_schema.schemata 
       WHERE schema_name NOT IN ('information_schema', 'pg_catalog')`
    );
    return {
      datasets: result.rows.map((row: { id: string }) => ({ id: row.id, name: row.id })),
      nextPageToken: undefined
    };
  }

  async executeQuery(query: string): Promise<any[]> {
    const result = await this.client.query(query);
    return result.rows;
  }
}

export const createDriver = ({
  credentials, 
  projectId, 
  type
}: {
  credentials: DatabaseCredentials, 
  projectId: string | null,
  type: string
}): Driver => {
  switch (type) {
    case "bigquery":
      return new BigQueryDriver(credentials as BigQueryCredentials, projectId!);
    case "postgres":
      return new PostgresDriver(credentials as PostgresCredentials);
    default:
      throw new Error(`Unsupported database type: ${type}`);
  }
};
