import { defineConfig } from "drizzle-kit";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// Read the single root .env file
function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const rootEnvPath = resolve(import.meta.dir, "../../.env");
  if (existsSync(rootEnvPath)) {
    const envContent = readFileSync(rootEnvPath, "utf-8");
    const match = envContent.match(/^DATABASE_URL=(.+)$/m);
    if (match && match[1]) {
      return match[1].trim().replace(/^["']|["']$/g, "");
    }
  }

  return "postgres://postgres:postgrespassword@172.105.92.7:5432/analytika";
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: getDatabaseUrl(),
  },
  verbose: true,
  strict: true,
});
