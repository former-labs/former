import type { BigQueryCredentials, Integration, PostgresCredentials } from "../types/connections.js";
import { BigQueryDriver, type Driver, PostgresDriver } from "./drivers/clients.js";

const connections = new Map<string, Driver>();

export const database = {
  async connect(integration: Integration) {
    try {
      console.log('Integration received:', {
        type: integration.type,
        typeOf: typeof integration.type,
        name: integration.name,
        config: integration.config
      });

      let driver: Driver;
      const connectionId = integration.id ?? crypto.randomUUID();
      console.log('integration', integration);

      switch (integration.type) {
        case 'bigquery':
          driver = new BigQueryDriver(integration.credentials as BigQueryCredentials, integration.config?.projectId ?? '');
          break;
        case 'postgres':
          driver = new PostgresDriver(integration.credentials as PostgresCredentials);
          break;
        default:
          throw new Error(`Invalid database type: ${integration.type} \n\n Integration: \n${JSON.stringify(integration)}`);
      }

      console.log('driver', driver);
      await driver.connect();
      connections.set(connectionId, driver);

      console.log('connections', connections);
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
    return await connection.fetchMetadata();
  },

  async disconnectAll() {
    for (const [id, connection] of connections) {
      await connection.disconnect();
      connections.delete(id);
    }
  }
};