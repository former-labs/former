import { env } from "@/env";
import CryptoJS from "crypto-js";
import { customType } from "drizzle-orm/pg-core";


export const encryptedJson = customType<{ data: GoogleAnalyticsCredentials }>({
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
  toDriver(value: GoogleAnalyticsCredentials) {
    try {
      const jsonString = JSON.stringify(value)
      return CryptoJS.AES.encrypt(jsonString, env.DB_COLUMN_ENCRYPTION_SECRET).toString()
    } catch (error) {
      console.error('Error encrypting JSON:', error)
      throw error
    }
  },
});

// Types
type GoogleAnalyticsCredentials = {
  scopes: string[];
  accessToken: string;
  refreshToken: string;
};
