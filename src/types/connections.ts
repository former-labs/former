import { z } from "zod";

export interface BigQueryCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain?: string;
}

export interface PostgresCredentials {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export type DatabaseCredentials = BigQueryCredentials | PostgresCredentials;

export const DATABASE_TYPES = [
  "bigquery",
  "postgres",
  "mysql",
  "sqlserver",
  "snowflake",
  "databricks",
] as const;
export type DatabaseType = (typeof DATABASE_TYPES)[number];

export interface DatabaseInstructions {
  type: DatabaseType;
  query: string;
  description: string;
  columnMappings: {
    projectId: string;
    datasetId: string;
    tableName: string;
    tableDescription: string;
    columnName: string;
    columnType: string;
    columnDescription: string;
  };
}

export type Integration = {
  id: string;
  workspaceId: string;
  type: DatabaseType;
  name: string;
  credentials: DatabaseCredentials;
  config: IntegrationConfig | null;
  createdAt: string;
  demo?: boolean;
};

export type IntegrationConfig = BigQueryConfig;

export type BigQueryConfig = {
  projectId: string;
};

export const fieldSchema: z.ZodType<{
  name: string;
  type: string;
  description: string | null;
  fields?: Array<Field>;
}> = z.object({
  name: z.string(),
  type: z.string(),
  description: z.string().nullable(),
  fields: z.lazy(() => z.array(fieldSchema)).optional()
});

const tableSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  fields: z.array(fieldSchema),
  includedInAIContext: z.boolean().optional()
});

const datasetSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  tableCount: z.number(),
  tables: z.array(tableSchema),
  includedInAIContext: z.boolean().optional()
});

const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  datasets: z.array(datasetSchema)
});

export const databaseMetadataSchema = z.object({
  dialect: z.enum(DATABASE_TYPES),
  projects: z.array(projectSchema)
});

export type DatabaseMetadata = z.infer<typeof databaseMetadataSchema>;
export type Field = z.infer<typeof fieldSchema>;
export type Table = z.infer<typeof tableSchema>;
export type Dataset = z.infer<typeof datasetSchema>;
export type Project = z.infer<typeof projectSchema>;
