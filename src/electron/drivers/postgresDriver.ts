import pkg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import type { DatabaseMetadata, PostgresCredentials, Project, Table } from "../../types/connections.js";
import { Driver } from "./driver.js";

const { Pool } = pkg;

export class PostgresDriver extends Driver {
  private pool: pkg.Pool;
  private jobs: Map<string, {
    status: "complete" | "error" | "canceled" | "running";
    client: pkg.PoolClient;
    pid?: number;
    error?: string;
    result?: any[];
    promise: Promise<void>;
  }>;

  constructor(credentials: PostgresCredentials) {
    super(credentials);
    this.pool = new Pool({
      host: credentials.host,
      port: credentials.port,
      database: credentials.database,
      user: credentials.user,
      password: credentials.password,
    });
    this.jobs = new Map();
  }

  async connect(): Promise<void> {
    // Test the connection
    const client = await this.pool.connect();
    client.release();
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
  }

  async fetchProjectsAndDatasets(): Promise<DatabaseMetadata> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
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

      return { dialect: "postgres", projects: [project] };
    } finally {
      client.release();
    }
  }

  async fetchTablesForDataset(datasetId: string): Promise<{
    tables: Table[];
    nextPageToken?: string;
  }> {
    const MAX_TABLES_PER_BATCH = 100;
    const client = await this.pool.connect();
    try {
      // First get total count of tables
      const countResult = await client.query(
        `SELECT COUNT(*) as count
         FROM information_schema.tables
         WHERE table_schema = $1`,
        [datasetId]
      );
      const totalTables = parseInt(countResult.rows[0].count, 10);

      // Fetch tables with pagination-like behavior
      const result = await client.query(
        `SELECT 
          t.table_name,
          obj_description(format('%I.%I', t.table_schema, t.table_name)::regclass::oid) as table_description,
          json_agg(json_build_object(
            'name', c.column_name,
            'type', c.data_type,
            'description', col_description(format('%I.%I', t.table_schema, t.table_name)::regclass::oid, c.ordinal_position)
          )) as columns
        FROM information_schema.tables t
        JOIN information_schema.columns c 
          ON t.table_schema = c.table_schema 
          AND t.table_name = c.table_name
        WHERE t.table_schema = $1
        GROUP BY t.table_schema, t.table_name
        LIMIT $2`,
        [datasetId, MAX_TABLES_PER_BATCH]
      );

      const tables = result.rows.map((row: {
        table_name: string;
        table_description: string | null;
        columns: Array<{
          name: string;
          type: string;
          description: string | null;
        }>;
      }) => {
        try {
          return {
            id: row.table_name,
            name: row.table_name,
            description: row.table_description,
            fields: row.columns.map(col => ({
              name: col.name,
              type: col.type,
              description: col.description
            }))
          };
        } catch (error) {
          console.error(`Error processing table ${row.table_name}:`, error);
          // Return minimal table object if processing fails
          return {
            id: row.table_name,
            name: row.table_name,
            description: 'Failed to process table metadata',
            fields: []
          };
        }
      });

      return {
        tables,
        // Return nextPageToken if there are more tables to fetch
        nextPageToken: tables.length < totalTables ? datasetId : undefined
      };
    } catch (error) {
      console.error(`Error fetching tables for dataset ${datasetId}:`, error);
      throw new Error(`Failed to fetch tables for dataset ${datasetId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      client.release();
    }
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
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT schema_name as id FROM information_schema.schemata 
         WHERE schema_name NOT IN ('information_schema', 'pg_catalog')`
      );
      return {
        datasets: result.rows.map((row: { id: string }) => ({ id: row.id, name: row.id })),
        nextPageToken: undefined
      };
    } finally {
      client.release();
    }
  }

  async executeQuery(query: string): Promise<{
    jobId: string;
  }> {
    const jobId = uuidv4();
    const client = await this.pool.connect();

    try {
      // Get the backend PID first
      const pidResult = await client.query('SELECT pg_backend_pid()');
      const pid = pidResult.rows[0].pg_backend_pid;

      const promise = new Promise<void>((resolve) => {
        client.query(query)
          .then((result) => {
            console.log("QUERY PROMISE DONE");
            const jobInfo = this.jobs.get(jobId);
            if (!jobInfo) {
              throw new Error(`Job ${jobId} not found`);
            }

            // If job was running, set it to complete
            // Otherwise it must have been set to canceled, so we skip this
            if (jobInfo.status === "running") {
              jobInfo.status = "complete";
              jobInfo.result = result.rows;
            }

            resolve();
          })
          .catch((error) => {
            console.log("QUERY PROMISE ERROR");
            const jobInfo = this.jobs.get(jobId);
            if (!jobInfo) {
              throw new Error(`Job ${jobId} not found`);
            }

            // Postgres appears to throw this error when a query is canceled
            // Worst case if this message differs, it will just throw a regular error
            if (error.message === "canceling statement due to user request") {
              jobInfo.status = "canceled";
            } else {
              jobInfo.status = "error";
              jobInfo.error = error.message;
            }
            resolve();
          });
      });

      this.jobs.set(jobId, {
        status: "running",
        client,
        pid,
        error: undefined,
        promise
      });

      return { jobId };
    } catch (error) {
      client.release();
      console.error('Error executing Postgres query:', error);
      throw error;
    }
  }

  async cancelJob(jobId: string): Promise<void> {
    console.log("CANCELING JOB", jobId);
    const jobInfo = this.jobs.get(jobId);
    if (!jobInfo) {
      throw new Error(`Job ${jobId} not found`);
    }
    if (!jobInfo.pid) {
      throw new Error(`No PID found for job ${jobId}`);
    }

    const cancelResult = await this.pool.query('SELECT pg_cancel_backend($1)', [jobInfo.pid]);
    console.log("CANCELLED JOB", cancelResult);
    // jobInfo.client.release();

    // jobInfo.complete = true;

    // try {
    //   await this.pool.query('SELECT pg_cancel_backend($1)', [jobInfo.pid]);
    // } finally {
    //   if (jobInfo.client) {
    //     jobInfo.client.release();
    //   }
    //   this.jobs.delete(jobId);
    // }
  }

  async getJobResult(jobId: string): Promise<{
    status: "complete";
    result: any[];
  } | {
    status: "error";
    error: string;
  } | {
    status: "canceled";
  }> {
    const jobInfo = this.jobs.get(jobId);
    if (!jobInfo) {
      throw new Error(`Job ${jobId} not found`);
    }

    await jobInfo.promise;
    console.log("FINSIHIGN WAITING PROIMSE");

    if (jobInfo.status === "canceled") {
      this.jobs.delete(jobId);
      return {
        status: "canceled",
      };
    }

    if (jobInfo.status === "error") {
      jobInfo.client.release();
      this.jobs.delete(jobId);
      return {
        status: "error",
        error: jobInfo.error!,
      };
    }

    if (jobInfo.status === "complete") {
      jobInfo.client.release();
      this.jobs.delete(jobId);
      return {
        status: "complete",
        result: jobInfo.result || []
      };
    }

    throw new Error("Job promise returned while not finished.")
  }
}
