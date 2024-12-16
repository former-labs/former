import type { BigQueryCredentials, DatabaseConfig, PostgresCredentials } from "../types/connections.js";
import { BigQueryDriver, type Driver, PostgresDriver } from "./drivers/clients.js";

const connections = new Map<string, Driver>();

export const database = {
  async connect(config: DatabaseConfig) {
    try {
      let driver: Driver;
      const connectionId = config.id;

      if (config.type === 'bigquery' && config.projectId) {
        driver = new BigQueryDriver(config.credentials as BigQueryCredentials, config.projectId);
      } else if (config.type === 'postgres') {
        driver = new PostgresDriver(config.credentials as PostgresCredentials);
      } else {
        throw new Error(`Invalid database type: ${config.type}`);
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

  async getMetadata(connectionId: string) {
    const connection = connections.get(connectionId);
    if (!connection) throw new Error(`Connection not found: ${connectionId}`);
    return connection.fetchMetadata();
  },

  async disconnectAll() {
    for (const [id, connection] of connections) {
      await connection.disconnect();
      connections.delete(id);
    }
  }
};