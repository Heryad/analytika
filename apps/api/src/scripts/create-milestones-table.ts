import { sql } from "drizzle-orm";
import { db } from "../db";

async function main() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS milestones (
      id varchar(64) PRIMARY KEY NOT NULL,
      website_id varchar(64) NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
      name varchar(255) NOT NULL,
      type varchar(50) DEFAULT 'event' NOT NULL,
      trigger varchar(255) NOT NULL,
      target_count integer DEFAULT 1000 NOT NULL,
      revenue_per_completion integer DEFAULT 0 NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL
    );
  `);
  console.log("Milestones table successfully created in PostgreSQL!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
