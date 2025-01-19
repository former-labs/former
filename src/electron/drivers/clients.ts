import type { BigQueryCredentials, DatabaseCredentials, PostgresCredentials } from "../../types/connections.js";
import { BigQueryDriver } from './bigQueryDriver.js';
import { type Driver } from "./driver.js";
import { PostgresDriver } from './postgresDriver.js';

export const createDriver = ({
  credentials, 
  projectId, 
  type
}: {
  credentials: DatabaseCredentials, 
  projectId: string | null,
  type: string
}): Driver => {
  switch (type) {
    case "bigquery":
      return new BigQueryDriver(credentials as BigQueryCredentials, projectId!);
    case "postgres":
      return new PostgresDriver(credentials as PostgresCredentials);
    default:
      throw new Error(`Unsupported database type: ${type}`);
  }
};
