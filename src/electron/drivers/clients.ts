import { BigQuery, type TableField } from "@google-cloud/bigquery";
import pkg from 'pg';
import type { BigQueryCredentials, DatabaseCredentials, DatabaseMetadata, PostgresCredentials, Table } from "../../types/connections.js";
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
  abstract fetchMetadata(): Promise<DatabaseMetadata>;
  abstract fetchDatasets(pageToken?: string): Promise<{
    datasets: Array<{ id: string; name: string }>;
    nextPageToken?: string;
  }>;
  abstract fetchTablesForDataset(datasetId: string, pageToken?: string): Promise<{
    tables: Table[];
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

    const tablesWithMetadata = await Promise.all(
      tables.map(async (table) => {
        const [metadata] = await table.getMetadata();
        if (!table.id) {
          throw new Error(`Table ID is undefined for dataset ${datasetId}`);
        }
        return {
          id: table.id,
          name: metadata.friendlyName,
          description: metadata.description ?? null,
          fields: metadata.schema.fields.map((field: TableField) => ({
            name: field.name,
            type: field.type,
            description: field.description ?? null,
          })),
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

  async fetchMetadata(): Promise<DatabaseMetadata> {
    const metadata: DatabaseMetadata = {
      projects: [{
        id: this.getProjectId(),
        name: this.getProjectName(),
        description: null,
        datasets: [],
      }]
    };

    let datasetsPageToken: string | undefined;
    do {
      const { datasets, nextPageToken } = await this.fetchDatasets(datasetsPageToken);
      const project = metadata.projects[0];
      if (project) {
        // Fetch tables for each dataset
        for (const dataset of datasets) {
          const datasetInfo = {
            id: dataset.id,
            name: dataset.name,
            description: null,
            tables: [] as Table[],
          };
          
          let tablesPageToken: string | undefined;
          do {
            const { tables, nextPageToken: tableNextPageToken } = 
              await this.fetchTablesForDataset(dataset.id, tablesPageToken);
            datasetInfo.tables.push(...tables);
            tablesPageToken = tableNextPageToken;
          } while (tablesPageToken);
          
          project.datasets.push(datasetInfo);
        }
      }
      datasetsPageToken = nextPageToken;
    } while (datasetsPageToken);

    return metadata;
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

  async fetchMetadata(): Promise<DatabaseMetadata> {
    const metadata: DatabaseMetadata = { projects: [] };

    try {
      // Get all schemas (equivalent to datasets in BigQuery)
      const schemasQuery = `
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name NOT IN ('information_schema', 'pg_catalog')
      `;
      const schemasResult = await this.client.query(schemasQuery);

      type Project = Required<DatabaseMetadata>['projects'][number];
      type Dataset = Project['datasets'][number];

      const project: Project = {
        id: this.credentials.database,
        name: this.credentials.database,
        description: null,
        datasets: [],
      };

      for (const schema of schemasResult.rows) {
        const datasetInfo: Dataset = {
          id: schema.schema_name,
          name: schema.schema_name,
          description: null,
          tables: [],
        };

        // Get all tables and their columns in the schema
        const tablesQuery = `
          SELECT 
            t.table_name,
            c.column_name,
            c.data_type,
            col_description(format('%I.%I', t.table_schema, t.table_name)::regclass::oid, c.ordinal_position) as description
          FROM information_schema.tables t
          JOIN information_schema.columns c 
            ON t.table_schema = c.table_schema 
            AND t.table_name = c.table_name
          WHERE t.table_schema = $1
          ORDER BY t.table_name, c.ordinal_position
        `;
        const tablesResult = await this.client.query(tablesQuery, [schema.schema_name]);

        // Group columns by table
        const tableMap = new Map();
        for (const row of tablesResult.rows) {
          if (!tableMap.has(row.table_name)) {
            tableMap.set(row.table_name, {
              id: `${schema.schema_name}.${row.table_name}`,
              name: row.table_name,
              description: null,
              fields: [],
            });
          }
          const table = tableMap.get(row.table_name);
          table.fields.push({
            name: row.column_name,
            type: row.data_type,
            description: row.description || null,
          });
        }

        datasetInfo.tables = Array.from(tableMap.values());
        project.datasets.push(datasetInfo);
      }

      metadata.projects = [project];
    } catch (error) {
      console.error('Error fetching Postgres metadata:', error);
      throw error;
    }

    return metadata;
  }

  async executeQuery(query: string): Promise<any[]> {
    try {
      const result = await this.client.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error executing Postgres query:', error);
      throw error;
    }
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
      datasets: result.rows.map((row: { id: any; }) => ({ 
        id: row.id, 
        name: row.id 
      })),
      nextPageToken: undefined
    };
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
