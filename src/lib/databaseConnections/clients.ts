import type { WarehouseMetadata } from "@/contexts/DataContext";
import type { IntegrationSelect } from "@/server/db/schema";
import { BigQuery } from "@google-cloud/bigquery";
import { Client } from "pg";

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
export abstract class DatabaseConnection {
  protected credentials: any;

  constructor(credentials: any) {
    this.credentials = credentials;
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract fetchMetadata(): Promise<WarehouseMetadata>;
  abstract executeQuery(query: string): Promise<any[]>;
}

export class BigQueryConnection extends DatabaseConnection {
  private client: BigQuery;

  constructor(credentials: any) {
    super(credentials);
    this.client = new BigQuery({
      credentials: keysToSnakeCase(credentials, {}),
      projectId: credentials.projectId,
    });
  }

  async connect(): Promise<void> {
    // BigQuery client doesn't require explicit connection
  }

  async disconnect(): Promise<void> {
    // BigQuery client doesn't require explicit disconnection
  }

  async fetchMetadata(): Promise<WarehouseMetadata> {
    const metadata: WarehouseMetadata = { projects: [] };
    
    try {
      // Get all datasets in the project
      const [datasets] = await this.client.getDatasets();
      
      type Project = Required<WarehouseMetadata>['projects'][number];
      type Dataset = Project['datasets'][number];

      const project: Project = {
        id: this.credentials.projectId,
        name: this.credentials.projectId,
        datasets: [],
      };

      for (const dataset of datasets) {
        const datasetInfo: Dataset = {
          id: dataset.id ?? 'unknown',
          name: dataset.id ?? 'unknown',
          tables: [],
        };

        // Get all tables in the dataset
        const [tables] = await dataset.getTables();
        
        for (const table of tables) {
          const [metadata] = await table.getMetadata();
          
          datasetInfo.tables.push({
            id: table.id ?? 'unknown',
            name: metadata.tableReference.tableId ?? 'unknown',
            fields: metadata.schema.fields.map((field: any) => ({
              name: field.name,
              type: field.type,
              description: field.description || undefined,
            })),
          });
        }

        project.datasets.push(datasetInfo);
      }

      metadata.projects = [project];
    } catch (error) {
      console.error('Error fetching BigQuery metadata:', error);
      throw error;
    }

    return metadata;
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
}

export class PostgresConnection extends DatabaseConnection {
  private client: Client;

  constructor(credentials: any) {
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

  async fetchMetadata(): Promise<WarehouseMetadata> {
    const metadata: WarehouseMetadata = { projects: [] };

    try {
      // Get all schemas (equivalent to datasets in BigQuery)
      const schemasQuery = `
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name NOT IN ('information_schema', 'pg_catalog')
      `;
      const schemasResult = await this.client.query(schemasQuery);

      type Project = Required<WarehouseMetadata>['projects'][number];
      type Dataset = Project['datasets'][number];

      const project: Project = {
        id: this.credentials.database,
        name: this.credentials.database,
        datasets: [],
      };

      for (const schema of schemasResult.rows) {
        const datasetInfo: Dataset = {
          id: schema.schema_name,
          name: schema.schema_name,
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
              fields: [],
            });
          }
          const table = tableMap.get(row.table_name);
          table.fields.push({
            name: row.column_name,
            type: row.data_type,
            description: row.description,
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
}

export const createDatabaseConnection = (integration: IntegrationSelect): DatabaseConnection => {
  switch (integration.type) {
    case "bigquery":
      return new BigQueryConnection(integration.credentials);
    case "postgres":
      return new PostgresConnection(integration.credentials);
    default:
      throw new Error(`Unsupported database type: ${integration.type}`);
  }
};
