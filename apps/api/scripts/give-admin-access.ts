import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(import.meta.dir, "../.env") });

import { db } from "../src/db";
import { users } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { PLANS } from "../src/config/plans";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Please provide your email address. Example: bun run give-admin-access.ts you@example.com");
    process.exit(1);
  }

  const growthConfig = PLANS.growth;
  
  console.log(`Upgrading ${email} to max level...`);

  const [updatedUser] = await db
    .update(users)
    .set({
      plan: "growth",
      billingInterval: "year",
      eventQuota: 20000000, // 20m events (max tier)
      maxWebsites: growthConfig.maxWebsites,
      maxFunnels: growthConfig.maxFunnels,
      maxAlerts: growthConfig.maxAlerts,
      hasSocialRadar: growthConfig.hasSocialRadar,
      retentionDays: growthConfig.retentionDays,
      subscriptionStatus: "active",
      currentPeriodEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 100)), // 100 years from now
      updatedAt: new Date(),
    })
    .where(eq(users.email, email))
    .returning();

  if (updatedUser) {
    console.log(`✅ Successfully upgraded ${email} to Growth Plan (20m events) for 100 years!`);
  } else {
    console.error(`❌ Could not find user with email: ${email}`);
  }

  process.exit(0);
}

main().catch(console.error);
