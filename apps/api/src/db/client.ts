import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import * as relations from "./relations";

const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/analytika";

// Disable prefetch as it is not supported for "Transaction" pool mode
export const queryClient = postgres(connectionString, {
  max: process.env.NODE_ENV === "production" ? 20 : 5,
  idle_timeout: 30,
  connect_timeout: 10,
});

export const db = drizzle(queryClient, {
  schema: { ...schema, ...relations },
});

export type DbType = typeof db;
