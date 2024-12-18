import * as dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

// Get the current directory and project root
const currentDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(currentDir, "..", "..");

// Load environment variables from .env file
dotenv.config({ path: join(projectRoot, ".env.local") });

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DASHBOARD_URI: z.string(),
});

export const env = envSchema.parse(process.env);
