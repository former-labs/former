import { env } from "@/env";
import CryptoJS from "crypto-js";
import { customType } from "drizzle-orm/pg-core";

export interface BigQueryCredentials {
  // Service account key file contents
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

export const encryptedJson = customType<{ data: DatabaseCredentials }>({
  dataType() {
    return "text"
  },
  fromDriver(value: unknown) {
    try {
      if (typeof value !== 'string') {
        throw new Error('Expected string value from database')
      }
      const decrypted = CryptoJS.AES.decrypt(value, env.DB_COLUMN_ENCRYPTION_SECRET).toString(
        CryptoJS.enc.Utf8
      )
      if (!decrypted) {
        throw new Error('Decryption failed')
      }
      return JSON.parse(decrypted)
    } catch (error) {
      console.error('Error decrypting/parsing JSON:', error)
      throw error
    }
  },
  toDriver(value: DatabaseCredentials) {
    try {
      const jsonString = JSON.stringify(value)
      return CryptoJS.AES.encrypt(jsonString, env.DB_COLUMN_ENCRYPTION_SECRET).toString()
    } catch (error) {
      console.error('Error encrypting JSON:', error)
      throw error
    }
  },
});
