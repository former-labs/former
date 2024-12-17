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

export interface WarehouseMetadata {
  projects: Array<{
    id: string;
    name: string;
    description: string;
    datasets: Array<{
      id: string;
      name: string;
      description: string;
      tables: Array<{
        id: string;
        name: string;
        description: string;
        fields: Array<{
          name: string;
          type: string;
          description: string | null;
        }>;
      }>;
    }>;
  }>;
} 