import { Elysia, t } from "elysia";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { authMiddleware } from "@/middleware/auth";
import { env } from "@/config/env";
import { logger } from "@/lib/logger";
import { PLANS, VOLUME_TIERS } from "@/config/plans";
import { clickhouse } from "@/db/clickhouse";
import { 
  sendSubscriptionSuccessEmail, 
  sendSubscriptionCanceledEmail 
} from "@/services/resend";

export const billingRoutes = new Elysia({ prefix: "/api/v1/billing" })
  .use(authMiddleware)

  /**
   * 1. Get Subscription Status, Quota Usage & Plan Limits
   */
  .get("/status", async ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }

    try {
      const [currentUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      if (!currentUser) {
        set.status = 404;
        return { success: false, error: "User not found" };
      }

      // Calculate monthly event usage from ClickHouse for the current user's websites
      let monthlyEventUsage = 0;
      try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
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
            userId: user.id,
            from: fromStr,
          },
          format: "JSONEachRow",
        });
        const rows: any = await chRes.json();
        if (rows && rows.length > 0) {
          monthlyEventUsage = Number(rows[0].total || 0);
        }
      } catch (err) {
        // Fallback if ClickHouse cross-query is unavailable
        try {
          const chRes = await clickhouse.query({
            query: `SELECT count() as total FROM events WHERE timestamp >= now() - INTERVAL 30 DAY`,
            format: "JSONEachRow",
          });
          const rows: any = await chRes.json();
          if (rows && rows.length > 0) {
            monthlyEventUsage = Math.min(Number(rows[0].total || 0), currentUser.eventQuota);
          }
        } catch {}
      }

      const planConfig = PLANS[currentUser.plan as "solo" | "growth"] || PLANS.solo;

      // Calculate trial remaining days
      let trialDaysRemaining = 0;
      if (currentUser.subscriptionStatus === "trialing" && currentUser.trialEndsAt) {
        const diffMs = new Date(currentUser.trialEndsAt).getTime() - Date.now();
        trialDaysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      }

      return {
        success: true,
        subscription: {
          plan: currentUser.plan,
          planName: planConfig.name,
          billingInterval: currentUser.billingInterval,
          status: currentUser.subscriptionStatus, // 'active' | 'trialing' | 'canceled' | 'past_due'
          eventQuota: currentUser.eventQuota,
          eventUsage: monthlyEventUsage,
          usagePercentage: Math.min(100, Math.round((monthlyEventUsage / (currentUser.eventQuota || 1)) * 100)),
          trialEndsAt: currentUser.trialEndsAt?.toISOString() || null,
          trialDaysRemaining,
          currentPeriodEnd: currentUser.currentPeriodEnd?.toISOString() || null,
          hasPolarSubscription: Boolean(currentUser.polarSubscriptionId),
          limits: {
            maxWebsites: currentUser.maxWebsites,
            maxFunnels: currentUser.maxFunnels,
            maxAlerts: currentUser.maxAlerts,
            hasSocialRadar: currentUser.hasSocialRadar,
            retentionDays: currentUser.retentionDays,
          },
        },
      };
    } catch (err: any) {
      logger.error("Failed to fetch billing status:", err);
      set.status = 500;
      return { success: false, error: "Internal server error" };
    }
  })

  /**
   * 2. Create Polar Checkout Session for Plan Subscription or Upgrade
   */
  .post(
    "/checkout",
    async ({ body, user, set }) => {
      if (!user) {
        set.status = 401;
        return { success: false, error: "Unauthorized" };
      }

      const { plan, interval, tierEvents } = body;
      const validPlan = plan === "growth" ? "growth" : "solo";
      const validInterval = interval === "year" ? "year" : "month";
      const selectedTier = VOLUME_TIERS.find((t) => t.events === tierEvents) || VOLUME_TIERS[1]; // default 100k

      try {
        const [currentUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, user.id))
          .limit(1);

        if (!currentUser) {
          set.status = 404;
          return { success: false, error: "User not found" };
        }

        // 1. If Polar Access Token is configured, create live Polar Checkout
        if (env.POLAR_ACCESS_TOKEN && env.POLAR_ACCESS_TOKEN.length > 5) {
          try {
            const polarRes = await fetch("https://api.polar.sh/v1/checkouts/custom/", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${env.POLAR_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                customer_email: currentUser.email,
                customer_name: currentUser.name || undefined,
                success_url: `${env.FRONTEND_URL}/dashboard/settings?tab=billing&checkout=success&plan=${validPlan}&interval=${validInterval}&events=${selectedTier.events}`,
                metadata: {
                  userId: user.id,
                  plan: validPlan,
                  billingInterval: validInterval,
                  eventQuota: selectedTier.events,
                },
              }),
            });

            if (polarRes.ok) {
              const polarData = await polarRes.json();
              if (polarData.url) {
                return {
                  success: true,
                  checkoutUrl: polarData.url,
                };
              }
            } else {
              logger.warn("Polar checkout API returned non-200, falling back:", await polarRes.text());
            }
          } catch (polarErr) {
            logger.warn("Polar API request failed, falling back to instant activation:", polarErr);
          }
        }

        // 2. Seamless Dev / Sandbox Activation Mode (For seamless instant local testing)
        const planConfig = PLANS[validPlan];
        const periodEnd = new Date();
        if (validInterval === "year") {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        await db
          .update(users)
          .set({
            plan: validPlan,
            billingInterval: validInterval,
            eventQuota: selectedTier.events,
            maxWebsites: planConfig.maxWebsites,
            maxFunnels: planConfig.maxFunnels,
            maxAlerts: planConfig.maxAlerts,
            hasSocialRadar: planConfig.hasSocialRadar,
            retentionDays: planConfig.retentionDays,
            subscriptionStatus: "active",
            currentPeriodEnd: periodEnd,
            polarSubscriptionId: currentUser.polarSubscriptionId || `sub_sandbox_${Date.now()}`,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));

        // Dispatch Subscription Confirmation Email
        sendSubscriptionSuccessEmail({
          email: currentUser.email,
          name: currentUser.name || undefined,
          planName: planConfig.name,
          billingInterval: validInterval,
          eventQuota: selectedTier.events,
          currentPeriodEnd: periodEnd,
        }).catch((emailErr) => logger.warn("Failed to dispatch subscription success email:", emailErr));

        return {
          success: true,
          mock: true,
          checkoutUrl: `${env.FRONTEND_URL}/dashboard/settings?tab=billing&subscribed=${validPlan}`,
        };
      } catch (err: any) {
        logger.error("Failed to create checkout session:", err);
        set.status = 500;
        return { success: false, error: "Failed to create checkout session" };
      }
    },
    {
      body: t.Object({
        plan: t.Union([t.Literal("solo"), t.Literal("growth")]),
        interval: t.Union([t.Literal("month"), t.Literal("year")]),
        tierEvents: t.Number(),
      }),
    }
  )

  /**
   * 3. Create Polar Customer Portal Session (Manage Invoices, Cards, Subscriptions)
   */
  .post("/portal", async ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }

    try {
      const [currentUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      if (!currentUser) {
        set.status = 404;
        return { success: false, error: "User not found" };
      }

      // If Polar Customer ID / Access Token exists, create customer session
      if (env.POLAR_ACCESS_TOKEN && currentUser.polarCustomerId) {
        try {
          const res = await fetch("https://api.polar.sh/v1/customer-sessions/", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${env.POLAR_ACCESS_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              customer_id: currentUser.polarCustomerId,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.customer_portal_url) {
              return { success: true, portalUrl: data.customer_portal_url };
            }
          }
        } catch (err) {
          logger.warn("Failed to generate Polar customer session:", err);
        }
      }

      // Fallback direct Polar portal or settings tab
      return {
        success: true,
        portalUrl: `https://polar.sh/analytika/portal`,
      };
    } catch (err: any) {
      logger.error("Failed to create portal session:", err);
      set.status = 500;
      return { success: false, error: "Internal server error" };
    }
  })

  /**
   * 4. Cancel Subscription (Retains Access Until Current Period End)
   */
  .post("/cancel", async ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }

    try {
      const [currentUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      if (!currentUser) {
        set.status = 404;
        return { success: false, error: "User not found" };
      }

      // If Polar Subscription ID exists, request cancellation at period end in Polar
      if (env.POLAR_ACCESS_TOKEN && currentUser.polarSubscriptionId && !currentUser.polarSubscriptionId.startsWith("sub_sandbox_")) {
        try {
          await fetch(`https://api.polar.sh/v1/subscriptions/${currentUser.polarSubscriptionId}`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${env.POLAR_ACCESS_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              cancel_at_period_end: true,
            }),
          });
        } catch (err) {
          logger.warn("Polar API cancellation warning:", err);
        }
      }

      // Update subscription status in database to 'canceled' (access remains until currentPeriodEnd)
      await db
        .update(users)
        .set({
          subscriptionStatus: "canceled",
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      // Dispatch Cancellation Confirmation Email
      const cancelPlanConfig = PLANS[currentUser.plan as "solo" | "growth"] || PLANS.solo;
      sendSubscriptionCanceledEmail({
        email: currentUser.email,
        name: currentUser.name || undefined,
        planName: cancelPlanConfig.name,
        currentPeriodEnd: currentUser.currentPeriodEnd,
      }).catch((emailErr) => logger.warn("Failed to dispatch cancellation email:", emailErr));

      return {
        success: true,
        message: "Subscription successfully canceled. You retain full access until the end of your billing cycle.",
        currentPeriodEnd: currentUser.currentPeriodEnd?.toISOString() || null,
      };
    } catch (err: any) {
      logger.error("Failed to cancel subscription:", err);
      set.status = 500;
      return { success: false, error: "Internal server error" };
    }
  })

  /**
   * 5. Resume Canceled Subscription (Before Period End)
   */
  .post("/resume", async ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }

    try {
      const [currentUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      if (!currentUser) {
        set.status = 404;
        return { success: false, error: "User not found" };
      }

      // If Polar Subscription ID exists, uncancel in Polar
      if (env.POLAR_ACCESS_TOKEN && currentUser.polarSubscriptionId && !currentUser.polarSubscriptionId.startsWith("sub_sandbox_")) {
        try {
          await fetch(`https://api.polar.sh/v1/subscriptions/${currentUser.polarSubscriptionId}`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${env.POLAR_ACCESS_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              cancel_at_period_end: false,
            }),
          });
        } catch (err) {
          logger.warn("Polar API resume warning:", err);
        }
      }

      await db
        .update(users)
        .set({
          subscriptionStatus: "active",
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      return {
        success: true,
        message: "Subscription reactivated successfully.",
      };
    } catch (err: any) {
      logger.error("Failed to resume subscription:", err);
      set.status = 500;
      return { success: false, error: "Internal server error" };
    }
  })

  /**
   * 6. Polar Webhook Listener (Handles Polar Events)
   */
  .post("/webhook", async ({ request, set }) => {
    try {
      const body: any = await request.json();
      const eventType = body?.type;
      const data = body?.data;

      logger.info(`Received Polar Webhook: ${eventType}`);

      if (!data) {
        return { received: true };
      }

      const userId = data.metadata?.userId || data.customer?.metadata?.userId;
      if (!userId) {
        logger.warn("Polar webhook received without userId metadata");
        return { received: true };
      }

      switch (eventType) {
        case "subscription.created":
        case "subscription.updated":
        case "subscription.active": {
          const plan = data.metadata?.plan || (data.product?.name?.toLowerCase().includes("growth") ? "growth" : "solo");
          const planConfig = PLANS[plan as "solo" | "growth"] || PLANS.solo;
          const quota = Number(data.metadata?.eventQuota || 100000);
          const interval = data.metadata?.billingInterval || (data.recurring_interval === "year" ? "year" : "month");

          const [updatedUser] = await db
            .update(users)
            .set({
              plan,
              billingInterval: interval,
              eventQuota: quota,
              maxWebsites: planConfig.maxWebsites,
              maxFunnels: planConfig.maxFunnels,
              maxAlerts: planConfig.maxAlerts,
              hasSocialRadar: planConfig.hasSocialRadar,
              retentionDays: planConfig.retentionDays,
              subscriptionStatus: "active",
              polarCustomerId: data.customer_id || data.customer?.id,
              polarSubscriptionId: data.id,
              currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : undefined,
              updatedAt: new Date(),
            })
            .where(eq(users.id, userId))
            .returning();

          if (updatedUser) {
            sendSubscriptionSuccessEmail({
              email: updatedUser.email,
              name: updatedUser.name || undefined,
              planName: planConfig.name,
              billingInterval: interval,
              eventQuota: quota,
              currentPeriodEnd: updatedUser.currentPeriodEnd,
            }).catch((emailErr) => logger.warn("Webhook subscription confirmation email error:", emailErr));
          }
          break;
        }

        case "subscription.canceled":
        case "subscription.revoked": {
          const [canceledUser] = await db
            .update(users)
            .set({
              subscriptionStatus: "canceled",
              updatedAt: new Date(),
            })
            .where(eq(users.id, userId))
            .returning();

          if (canceledUser) {
            sendSubscriptionCanceledEmail({
              email: canceledUser.email,
              name: canceledUser.name || undefined,
              planName: (PLANS[canceledUser.plan as "solo" | "growth"] || PLANS.solo).name,
              currentPeriodEnd: canceledUser.currentPeriodEnd,
            }).catch((emailErr) => logger.warn("Webhook cancellation email error:", emailErr));
          }
          break;
        }
      }

      return { received: true, success: true };
    } catch (err: any) {
      logger.error("Error processing Polar webhook:", err);
      set.status = 500;
      return { received: false, error: err.message };
    }
  });
