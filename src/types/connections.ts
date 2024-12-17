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

export interface DatabaseConfig {
  id: string;
  type: 'bigquery' | 'postgres';
  projectId?: string;
  credentials: DatabaseCredentials;
}


export const warehouseMetadataSchema = z.object({
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

export type WarehouseMetadata = z.infer<typeof warehouseMetadataSchema>;
