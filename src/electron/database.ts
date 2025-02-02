import type { BigQueryCredentials, LocalIntegrationData, PostgresCredentials } from "../types/connections.js";
import { type IElectronAPI } from "../types/electron.js";
import { BigQueryDriver } from "./drivers/bigQueryDriver.js";
import { type Driver } from "./drivers/driver.js";
import { PostgresDriver } from "./drivers/postgresDriver.js";

const connections = new Map<string, Driver>();

export const database: IElectronAPI['database'] = {
  async connect(integration: LocalIntegrationData) {
    try {
      let driver: Driver;
      const connectionId = integration.id ?? crypto.randomUUID();

      switch (integration.databaseType) {
        case 'bigquery':
          driver = new BigQueryDriver(integration.credentials as BigQueryCredentials, integration.config?.projectId ?? '');
          break;
        case 'postgres':
          driver = new PostgresDriver(integration.credentials as PostgresCredentials);
          break;
        default:
          throw new Error(`Invalid database type: ${integration.databaseType} \n\n Integration: \n${JSON.stringify(integration)}`);
      }

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
      await connection.disconnect();
      connections.delete(connectionId);
    }
  },

  async execute(connectionId: string, query: string) {
    const connection = connections.get(connectionId);
    if (!connection) throw new Error(`Connection not found: ${connectionId}`);
    return connection.executeQuery(query);
  },

  async cancelJob(connectionId: string, jobId: string) {
    const connection = connections.get(connectionId);
    if (!connection) throw new Error(`Connection not found: ${connectionId}`);
    return connection.cancelJob(jobId);
  },

  async getJobResult(connectionId: string, jobId: string) {
    const connection = connections.get(connectionId);
    if (!connection) throw new Error(`Connection not found: ${connectionId}`);
    return connection.getJobResult(jobId);
  },

  async getProjectsAndDatasets(connectionId: string) {
    const connection = connections.get(connectionId);
    if (!connection) throw new Error(`Connection not found: ${connectionId}`);
    return await connection.fetchProjectsAndDatasets();
  },

  async getTablesForDataset(connectionId: string, datasetId: string, pageToken?: string) {
    const connection = connections.get(connectionId);
    if (!connection) throw new Error(`Connection not found: ${connectionId}`);
    return await connection.fetchTablesForDataset(datasetId, pageToken);
  },

  async disconnectAll() {
    for (const [id, connection] of connections) {
      await connection.disconnect();
      connections.delete(id);
    }
  }
};
