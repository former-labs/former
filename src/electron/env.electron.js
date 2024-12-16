import * as dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { z } from "zod";

// Get the current directory and project root
const currentDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(currentDir, '..', '..');

// Load environment variables from .env file
dotenv.config({ path: join(projectRoot, '.env.local') });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // Add only the env vars that your Electron app needs
  DATABASE_URL: z.string().url(),
  DASHBOARD_URI: z.string(),
  NEXT_PUBLIC_SUPABASE_URL: z.string(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  // ... add other required variables
});

export const env = envSchema.parse(process.env); 