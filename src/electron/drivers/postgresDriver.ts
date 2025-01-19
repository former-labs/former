
import pkg from 'pg';
import type { PostgresCredentials, Project, Table } from "../../types/connections.js";
import { Driver } from "./driver.js";

const { Client } = pkg;

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

  async executeQuery(query: string): Promise<{
    result: any[]
  } | {
    error: string;
  }> {
    try {
      const result = await this.client.query(query);
      return { result: result.rows };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }
}
