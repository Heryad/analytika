import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/config/env";
import * as schema from "./schema";
import { logger } from "@/lib/logger";

// Create postgres connection pool
const queryClient = postgres(env.DATABASE_URL, {
  max: 20,
  idle_timeout: 30,
  connect_timeout: 10,
  onnotice: () => {}, // suppress notice spam
});

export const db = drizzle(queryClient, { schema });

export async function testDbConnection(): Promise<boolean> {
  try {
    await queryClient`SELECT 1`;
    logger.success("PostgreSQL database connected successfully via Drizzle ORM");
    return true;
  } catch (error) {
    logger.error("Failed to connect to PostgreSQL database:", error);
    return false;
  }
}
