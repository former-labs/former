import { BigQuery, type TableField } from "@google-cloud/bigquery";
import pkg from 'pg';
import snowflake from 'snowflake-sdk';
import type { BigQueryCredentials, DatabaseCredentials, DatabaseType, Field, PostgresCredentials, Project, SnowflakeCredentials, Table } from "../../types/connections.js";
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
export abstract class Driver<T extends DatabaseCredentials = DatabaseCredentials> {
  protected credentials: T;

  constructor(credentials: T) {
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

export class BigQueryDriver extends Driver<BigQueryCredentials> {
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

export class PostgresDriver extends Driver<PostgresCredentials> {
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

export class SnowflakeDriver extends Driver<SnowflakeCredentials> {
  private client: snowflake.Connection | null = null;
  private connection: snowflake.Connection | null = null;

  constructor(credentials: SnowflakeCredentials) {
    super(credentials);
    try {
      this.client = snowflake.createConnection({
        account: credentials.account,
        username: credentials.username,
        password: credentials.password,
        warehouse: credentials.warehouse,
        database: credentials.database,
        schema: credentials.schema,
      });
    } catch (error) {
      console.error('Failed to create Snowflake connection:', error);
      throw error;
    }
  }

  async connect(): Promise<void> {
    if (!this.client) {
      throw new Error('Snowflake client not initialized');
    }

    return new Promise((resolve, reject) => {
      this.client!.connect((err: Error | undefined, conn: snowflake.Connection) => {
        if (err) {
          console.error('Failed to connect to Snowflake:', err);
          reject(err);
        } else {
          this.connection = conn;
          resolve();
        }
      });
    });
  }

  async disconnect(): Promise<void> {
    if (!this.client) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.client!.destroy((err: Error | undefined) => {
        if (err) {
          console.error('Failed to disconnect from Snowflake:', err);
          reject(err);
        } else {
          this.client = null;
          this.connection = null;
          resolve();
        }
      });
    });
  }

  async executeQuery<T = any>(query: string): Promise<T[]> {
    if (!this.connection) {
      throw new Error('No active Snowflake connection');
    }

    return new Promise((resolve, reject) => {
      this.connection!.execute({
        sqlText: query,
        complete: (err: Error | undefined, stmt: snowflake.RowStatement, rows: T[] | undefined) => {
          if (err) {
            console.error('Failed to execute Snowflake query:', err);
            reject(err);
          } else {
            resolve(rows || []);
          }
        }
      });
    });
  }

  private async listDatabases(): Promise<string[]> {
    interface DatabaseRow {
      "name": string;
    }
    const rows = await this.executeQuery<DatabaseRow>("SHOW DATABASES");
    return rows.map(row => row.name);
  }

  private async listSchemas(database: string): Promise<string[]> {
    interface SchemaRow {
      "name": string;
    }
    const rows = await this.executeQuery<SchemaRow>(`SHOW SCHEMAS IN DATABASE "${database}"`);
    return rows.map(row => row.name);
  }

  private async listTables(database: string, schema: string): Promise<string[]> {
    interface TableRow {
      "name": string;
    }
    const rows = await this.executeQuery<TableRow>(`SHOW TABLES IN SCHEMA "${database}"."${schema}"`);
    return rows.map(row => row.name);
  }

  private async getTableColumns(database: string, schema: string, table: string): Promise<Array<{ name: string; type: string; }>> {
    interface ColumnRow {
      "name": string;
      "type": string;
    }
    const rows = await this.executeQuery<ColumnRow>(`DESCRIBE TABLE "${database}"."${schema}"."${table}"`);
    return rows.map(row => ({
      name: row.name,
      type: row.type
    }));
  }

  async fetchProjectsAndDatasets(): Promise<{
    projects: Project[];
  }> {
    try {
      if (!this.connection) {
        throw new Error('No active Snowflake connection');
      }

      const databases = await this.listDatabases();
      const projects: Project[] = [];

      for (const db of databases) {
        const schemas = await this.listSchemas(db);
        projects.push({
          id: db,
          name: db,
          description: null,
          datasets: schemas.map((schema) => ({
            id: schema,
            name: schema,
            description: null,
            tableCount: 0,
            tables: []
          }))
        });
      }

      return { projects };
    } catch (error) {
      console.error('Failed to fetch Snowflake projects and datasets:', error);
      throw error;
    }
  }

  async fetchTablesForDataset(datasetId: string): Promise<{
    tables: Table[];
    nextPageToken?: string;
  }> {
    try {
      if (!this.connection) {
        throw new Error('No active Snowflake connection');
      }

      const tables = await this.listTables(this.credentials.database, datasetId);
      const tablesWithMetadata = await Promise.all(
        tables.map(async (tableName) => {
          const columns = await this.getTableColumns(this.credentials.database, datasetId, tableName);
          return {
            id: tableName,
            name: tableName,
            description: null,
            fields: columns.map((col) => ({
              name: col.name,
              type: col.type,
              description: null,
            })),
          };
        })
      );

      return {
        tables: tablesWithMetadata,
        nextPageToken: undefined
      };
    } catch (error) {
      console.error('Failed to fetch Snowflake tables:', error);
      throw error;
    }
  }

  async fetchDatasets(): Promise<{
    datasets: Array<{ id: string; name: string }>;
    nextPageToken?: string;
  }> {
    try {
      if (!this.connection) {
        throw new Error('No active Snowflake connection');
      }

      const schemas = await this.listSchemas(this.credentials.database);
      return {
        datasets: schemas.map((schema) => ({
          id: schema,
          name: schema,
        })),
        nextPageToken: undefined
      };
    } catch (error) {
      console.error('Failed to fetch Snowflake datasets:', error);
      throw error;
    }
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
  type: DatabaseType
}): Driver<DatabaseCredentials> => {
  switch (type) {
    case "bigquery": {
      if (!isBigQueryCredentials(credentials)) {
        throw new Error('Invalid BigQuery credentials');
      }
      if (!projectId) {
        throw new Error('Project ID is required for BigQuery');
      }
      return new BigQueryDriver(credentials, projectId);
    }
    case "postgres": {
      if (!isPostgresCredentials(credentials)) {
        throw new Error('Invalid Postgres credentials');
      }
      return new PostgresDriver(credentials);
    }
    case "snowflake": {
      if (!isSnowflakeCredentials(credentials)) {
        throw new Error('Invalid Snowflake credentials');
      }
      return new SnowflakeDriver(credentials);
    }
    default:
      throw new Error(`Unsupported database type: ${type}`);
  }
};

function isBigQueryCredentials(creds: DatabaseCredentials): creds is BigQueryCredentials {
  return 'project_id' in creds && 'private_key' in creds;
}

function isPostgresCredentials(creds: DatabaseCredentials): creds is PostgresCredentials {
  return 'host' in creds && 'port' in creds && 'database' in creds;
}

function isSnowflakeCredentials(creds: DatabaseCredentials): creds is SnowflakeCredentials {
  return 'account' in creds && 'warehouse' in creds && 'schema' in creds;
}
