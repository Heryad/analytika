import { db } from "@/db";
import { users, websites, oauthAuthorizationRequests, oauthAuthorizationCodes, oauthAccessTokens } from "@/db/schema";
import { eq, and, isNull, lte, lt, or, sql } from "drizzle-orm";
import { clickhouse } from "@/db/clickhouse";
import { env } from "@/config/env";
import { logger } from "@/lib/logger";
import { PLANS } from "@/config/plans";
import { sendTrialExpiringEmail, sendQuotaNoticeEmail } from "./resend";

let cronTimer: ReturnType<typeof setInterval> | null = null;

/**
 * 1. Process Trial Expiration Warnings (3 Days Remaining)
 */
async function processTrialReminders(): Promise<number> {
  let remindersSent = 0;
  const now = new Date();

  try {
    // Find trialing users who haven't received a reminder yet
    const trialingUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        trialEndsAt: users.trialEndsAt,
      })
      .from(users)
      .where(
        and(
          eq(users.subscriptionStatus, "trialing"),
          isNull(users.trialReminderSentAt),
          sql`${users.trialEndsAt} IS NOT NULL`
        )
      );

    for (const u of trialingUsers) {
      if (!u.trialEndsAt) continue;
      const diffMs = new Date(u.trialEndsAt).getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      // If 3 days or fewer remaining, send reminder
      if (daysRemaining <= 3 && daysRemaining > 0) {
        logger.info(`Sending 3-day trial expiring notice to: ${u.email} (${daysRemaining} days left)`);

        await sendTrialExpiringEmail({
          email: u.email,
          name: u.name || undefined,
          daysRemaining,
          subscribeUrl: `${env.FRONTEND_URL}/dashboard/settings?tab=billing`,
        });

        await db
          .update(users)
          .set({ trialReminderSentAt: new Date() })
          .where(eq(users.id, u.id));

        remindersSent++;
      }
    }
  } catch (err: any) {
    logger.error("Error in processTrialReminders:", err);
  }

  return remindersSent;
}

/**
 * 2. Process Soft Quota Warnings (100% Monthly Usage Reached)
 */
async function processQuotaNotices(): Promise<number> {
  let noticesSent = 0;
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  try {
    // Find active users whose last notification was before this month or never sent
    const activeUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        plan: users.plan,
        eventQuota: users.eventQuota,
        lastQuotaNoticeSentAt: users.lastQuotaNoticeSentAt,
      })
      .from(users)
      .where(
        and(
          eq(users.subscriptionStatus, "active"),
          or(
            isNull(users.lastQuotaNoticeSentAt),
            lte(users.lastQuotaNoticeSentAt, startOfMonth)
          )
        )
      );

    for (const u of activeUsers) {
      try {
        // Query ClickHouse for monthly usage
        const fromStr = startOfMonth.toISOString().replace("T", " ").replace("Z", "").slice(0, 19);
        const chRes = await clickhouse.query({
          query: `
            SELECT count() as total
            FROM events
            WHERE website_id IN (
              SELECT id FROM postgresql('${env.DATABASE_URL.replace("postgres://", "")}', 'websites') WHERE user_id = {userId:UUID}
            )
            AND timestamp >= {from:DateTime}
          `,
          query_params: {
            userId: u.id,
            from: fromStr,
          },
          format: "JSONEachRow",
        });

        const rows: any = await chRes.json();
        const usage = Number(rows?.[0]?.total || 0);

        if (usage >= u.eventQuota && u.eventQuota > 0) {
          const planConfig = PLANS[u.plan as "solo" | "growth"] || PLANS.solo;

          logger.info(`Sending soft quota limit notice to: ${u.email} (${usage}/${u.eventQuota} events)`);

          await sendQuotaNoticeEmail({
            email: u.email,
            userName: u.name || undefined,
            currentUsage: usage,
            eventQuota: u.eventQuota,
            planName: planConfig.name,
          });

          await db
            .update(users)
            .set({ lastQuotaNoticeSentAt: new Date() })
            .where(eq(users.id, u.id));

          noticesSent++;
        }
      } catch (userErr: any) {
        // Skip individual user on CH lookup issue
        logger.warn(`Failed quota lookup for user ${u.id}:`, userErr?.message || userErr);
      }
    }
  } catch (err: any) {
    logger.error("Error in processQuotaNotices:", err);
  }

  return noticesSent;
}

/**
 * 3. Sweep expired / consumed OAuth rows
 *    - Expired authorization requests (user closed the consent tab)
 *    - Consumed authorization codes (already exchanged for tokens)
 *    - Revoked or expired access tokens older than 7 days
 */
async function sweepExpiredOAuthRows(): Promise<void> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  try {
    // Delete expired pending authorization requests
    await db
      .delete(oauthAuthorizationRequests)
      .where(lt(oauthAuthorizationRequests.expiresAt, now));

    // Delete consumed authorization codes
    await db
      .delete(oauthAuthorizationCodes)
      .where(sql`${oauthAuthorizationCodes.consumedAt} IS NOT NULL`);

    // Delete expired (and not just consumed) authorization codes older than 1 day
    await db
      .delete(oauthAuthorizationCodes)
      .where(lt(oauthAuthorizationCodes.expiresAt, now));

    // Delete revoked or fully-expired access tokens older than 7 days
    await db
      .delete(oauthAccessTokens)
      .where(
        and(
          lt(oauthAccessTokens.createdAt, sevenDaysAgo),
          or(
            sql`${oauthAccessTokens.revokedAt} IS NOT NULL`,
            lt(oauthAccessTokens.expiresAt, now)
          )
        )
      );
  } catch (err: any) {
    logger.warn("OAuth row sweep error:", err?.message || err);
  }
}

/**
 * Main Lifecycle Background Job Runner
 */
export async function runLifecycleChecks(): Promise<{ reminders: number; notices: number }> {
  const reminders = await processTrialReminders();
  const notices = await processQuotaNotices();
  await sweepExpiredOAuthRows();
  return { reminders, notices };
}

/**
 * Initialize Periodic Background Cron (Runs every 1 hour)
 */
export function startLifecycleCron(): void {
  if (cronTimer) return;

  logger.info("Starting background Lifecycle Cron worker (1-hour interval)...");

  // Initial check on startup (delayed 5s to allow DB connection to stabilize)
  setTimeout(async () => {
    try {
      const stats = await runLifecycleChecks();
      if (stats.reminders > 0 || stats.notices > 0) {
        logger.info(`Lifecycle initial check completed: ${stats.reminders} trial reminders, ${stats.notices} quota notices.`);
      }
    } catch (err) {
      logger.error("Initial lifecycle check error:", err);
    }
  }, 5000);

  // Periodic 1-hour interval
  cronTimer = setInterval(async () => {
    try {
      const stats = await runLifecycleChecks();
      if (stats.reminders > 0 || stats.notices > 0) {
        logger.info(`Lifecycle hourly run completed: ${stats.reminders} trial reminders, ${stats.notices} quota notices.`);
      }
    } catch (err) {
      logger.error("Periodic lifecycle cron error:", err);
    }
  }, 60 * 60 * 1000);
}
