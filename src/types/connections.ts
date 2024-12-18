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
}

export interface PostgresCredentials {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export type DatabaseCredentials = BigQueryCredentials | PostgresCredentials;

export type DatabaseType = 'bigquery' | 'postgres';

export type Integration = {
  id: string | null;
  type: DatabaseType;
  name: string;
  credentials: DatabaseCredentials;
  config: IntegrationConfig | null;
  createdAt: string;
};

export type IntegrationConfig = BigQueryConfig;

export type BigQueryConfig = {
  projectId: string;
};


export const databaseMetadataSchema = z.object({
  projects: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    datasets: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      tables: z.array(z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().nullable(),
        fields: z.array(z.object({
          name: z.string(),
          type: z.string(),
          description: z.string().nullable()
        }))
      }))
    }))
  }))
});



export type DatabaseMetadata = z.infer<typeof databaseMetadataSchema>;
