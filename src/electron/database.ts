import type { BigQueryCredentials, DatabaseType, Integration, PostgresCredentials, SnowflakeCredentials } from "../types/connections.js";
import { BigQueryDriver, type Driver, PostgresDriver, SnowflakeDriver } from "./drivers/clients.js";

const connections = new Map<string, Driver>();

const isValidDatabaseType = (type: string): type is DatabaseType => {
  return ['bigquery', 'postgres', 'snowflake'].includes(type);
};

function isBigQueryCredentials(creds: unknown): creds is BigQueryCredentials {
  return typeof creds === 'object' && creds !== null && 'project_id' in creds && 'private_key' in creds;
}

function isPostgresCredentials(creds: unknown): creds is PostgresCredentials {
  return typeof creds === 'object' && creds !== null && 'host' in creds && 'port' in creds && 'database' in creds;
}

function isSnowflakeCredentials(creds: unknown): creds is SnowflakeCredentials {
  return typeof creds === 'object' && creds !== null && 'account' in creds && 'warehouse' in creds && 'schema' in creds;
}

export const database = {
  async connect(integration: Integration) {
    try {
      console.log('Integration received:', {
        type: integration.type,
        name: integration.name,
        config: integration.config
      });

      if (!isValidDatabaseType(integration.type)) {
        throw new Error(`Invalid database type: ${integration.type}`);
      }

      if (!integration.credentials) {
        throw new Error('No credentials provided');
      }

      let driver: Driver;
      const connectionId = integration.id ?? crypto.randomUUID();

      const type = integration.type;
      switch (type) {
        case 'bigquery':
          if (!isBigQueryCredentials(integration.credentials)) {
            throw new Error('Invalid BigQuery credentials');
          }
          if (!integration.config?.projectId) {
            throw new Error('Project ID is required for BigQuery');
          }
          driver = new BigQueryDriver(integration.credentials, integration.config.projectId);
          break;
        case 'postgres':
          if (!isPostgresCredentials(integration.credentials)) {
            throw new Error('Invalid Postgres credentials');
          }
          driver = new PostgresDriver(integration.credentials);
          break;
        case 'snowflake':
          if (!isSnowflakeCredentials(integration.credentials)) {
            throw new Error('Invalid Snowflake credentials');
          }
          driver = new SnowflakeDriver(integration.credentials);
          break;
        default:
          throw new Error(`Unsupported database type: ${type}`);
      }

      console.log('Connecting to database...');
      await driver.connect();
      connections.set(connectionId, driver);

      return { success: true, connectionId };
    } catch (error) {
      console.error('Failed to create connection:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  async disconnect(connectionId: string) {
    const connection = connections.get(connectionId);
    if (connection) {
      try {
        await connection.disconnect();
      } catch (error) {
        console.error(`Failed to disconnect from ${connectionId}:`, error);
      } finally {
        connections.delete(connectionId);
      }
    }
  },

  async execute(connectionId: string, query: string) {
    const connection = connections.get(connectionId);
    if (!connection) {
      throw new Error(`Connection not found: ${connectionId}`);
    }
    try {
      return await connection.executeQuery(query);
    } catch (error) {
      console.error(`Failed to execute query on ${connectionId}:`, error);
      throw error;
    }
  },

  async getProjectsAndDatasets(connectionId: string) {
    const connection = connections.get(connectionId);
    if (!connection) {
      throw new Error(`Connection not found: ${connectionId}`);
    }
    try {
      return await connection.fetchProjectsAndDatasets();
    } catch (error) {
      console.error(`Failed to fetch projects and datasets from ${connectionId}:`, error);
      throw error;
    }
  },

  async getTablesForDataset(connectionId: string, datasetId: string, pageToken?: string) {
    const connection = connections.get(connectionId);
    if (!connection) {
      throw new Error(`Connection not found: ${connectionId}`);
    }
    try {
      return await connection.fetchTablesForDataset(datasetId, pageToken);
    } catch (error) {
      console.error(`Failed to fetch tables for dataset ${datasetId} from ${connectionId}:`, error);
      throw error;
    }
  },

  async disconnectAll() {
    const disconnectPromises = Array.from(connections.entries()).map(async ([id, connection]) => {
      try {
        await connection.disconnect();
      } catch (error) {
        console.error(`Failed to disconnect from ${id}:`, error);
      } finally {
        connections.delete(id);
      }
    });

    await Promise.all(disconnectPromises);
  }
};