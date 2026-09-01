import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env from apps/api and root
config({ path: resolve(__dirname, ".env") });
config({ path: resolve(__dirname, "../../.env") });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgres://postgres:postgrespassword@172.105.92.7:5432/analytika",
  },
  verbose: true,
  strict: true,
});
