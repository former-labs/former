import type { BigQueryCredentials, Integration, PostgresCredentials } from "../types/connections.js";
import { IElectronAPI } from "../types/electron.js";
import { BigQueryDriver } from "./drivers/bigQueryDriver.js";
import { type Driver } from "./drivers/driver.js";
import { PostgresDriver } from "./drivers/postgresDriver.js";

const connections = new Map<string, Driver>();

const connectDriver = async (integration: Integration) => {
  try {
    let driver: Driver;
    let error: string | undefined;

    switch (integration.type) {
      case 'bigquery':
        driver = new BigQueryDriver(integration.credentials as BigQueryCredentials, integration.config?.projectId ?? '');
        break;
      case 'postgres':
        driver = new PostgresDriver(integration.credentials as PostgresCredentials);
        break;
      default:
        error = `Invalid database type: ${integration.type} \n\n Integration: \n${JSON.stringify(integration)}`;
        throw new Error(error);
    }

    await driver.connect();

    return { success: true, driver };
  } catch (error: any) {
    console.error('Failed to create connection:', error);
    return { success: false, error: error.message };
  }
}

export const database: IElectronAPI['database'] = {
  async testConnection(integration: Integration) {
    const { success, error } = await connectDriver(integration);
    return { success, error };
  },
  async connect(integration: Integration) {
    const connectionId = integration.id ?? crypto.randomUUID();
    const {success, error, driver} = await connectDriver(integration);
    if (driver) {
      connections.set(connectionId, driver);
    }
    return { success, connectionId, error };
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
