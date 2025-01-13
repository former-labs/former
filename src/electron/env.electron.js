/*
  I gave up trying to get it to bundle the env vars with the electron app.

  Anyway this doesnt matter. We can just manage the env vars here since they
  aren't secret anyway and are being sent to the client.

  It works and who cares.
*/

import { z } from "zod";

// Get the current directory and project root
// const currentDir = dirname(fileURLToPath(import.meta.url));
// const projectRoot = join(currentDir, "..", "..");

// Load environment variables from .env file
// dotenv.config({ path: join(projectRoot, ".env.local") });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  DASHBOARD_URI: z.string(),
});

const envDevelopment = {
  NODE_ENV: "production",
  DASHBOARD_URI: "https://yerve.vercel.app",
};

export const env = envSchema.parse(envDevelopment);

// const envProduction = {
//   NODE_ENV: "production",
//   DASHBOARD_URI: "https://yerve.vercel.app",
// };

// export const env = envSchema.parse(envProduction);
