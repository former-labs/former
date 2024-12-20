import { z } from "zod";

export const bigQueryCredentialsSchema = z.object({
  type: z.string(),
  project_id: z.string(),
  private_key_id: z.string(),
  private_key: z.string(),
  client_email: z.string(),
  client_id: z.string(),
  auth_uri: z.string(),
  token_uri: z.string(),
  auth_provider_x509_cert_url: z.string(),
  client_x509_cert_url: z.string(),
});

export const postgresCredentialsSchema = z.object({
  host: z.string(),
  port: z.number(),
  database: z.string(),
  user: z.string(),
  password: z.string(),
});

export const snowflakeCredentialsSchema = z.object({
  account: z.string(),
  username: z.string(),
  password: z.string(),
  warehouse: z.string(),
  database: z.string(),
  schema: z.string(),
  role: z.string(),
});

export type BigQueryCredentials = z.infer<typeof bigQueryCredentialsSchema>;
export type PostgresCredentials = z.infer<typeof postgresCredentialsSchema>;
export type SnowflakeCredentials = z.infer<typeof snowflakeCredentialsSchema>;

export type DatabaseCredentials = BigQueryCredentials | PostgresCredentials | SnowflakeCredentials;

export type DatabaseType = 'bigquery' | 'postgres' | 'snowflake';

export const bigQueryConfigSchema = z.object({
  projectId: z.string(),
});

export type BigQueryConfig = z.infer<typeof bigQueryConfigSchema>;

export const bigQueryIntegrationSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.literal('bigquery'),
  credentials: bigQueryCredentialsSchema,
  config: bigQueryConfigSchema,
  createdAt: z.string(),
});

export const postgresIntegrationSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.literal('postgres'),
  credentials: postgresCredentialsSchema,
  config: z.undefined().optional(),
  createdAt: z.string(),
});

export const snowflakeIntegrationSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.literal('snowflake'),
  credentials: snowflakeCredentialsSchema,
  config: z.undefined().optional(),
  createdAt: z.string(),
});

export const integrationSchema = z.discriminatedUnion('type', [
  bigQueryIntegrationSchema,
  postgresIntegrationSchema,
  snowflakeIntegrationSchema,
]);

export type BigQueryIntegration = z.infer<typeof bigQueryIntegrationSchema>;
export type PostgresIntegration = z.infer<typeof postgresIntegrationSchema>;
export type SnowflakeIntegration = z.infer<typeof snowflakeIntegrationSchema>;
export type Integration = z.infer<typeof integrationSchema>;

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
  tables: z.array(tableSchema)
});

const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  datasets: z.array(datasetSchema)
});

export const databaseMetadataSchema = z.object({
  projects: z.array(projectSchema)
});

export type DatabaseMetadata = z.infer<typeof databaseMetadataSchema>;
export type Field = z.infer<typeof fieldSchema>;
export type Table = z.infer<typeof tableSchema>;
export type Dataset = z.infer<typeof datasetSchema>;
export type Project = z.infer<typeof projectSchema>;
