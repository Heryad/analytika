import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { bearer } from "@elysiajs/bearer";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { users, subscriptions } from "../db/schema";
import {
  PLAN_LIMITS,
  createPolarCheckoutSession,
  createPolarPortalSession,
  type PlanTier,
} from "../services/polar";

const JWT_SECRET = process.env.JWT_SECRET || "analytika_super_secret_jwt_key_development_only";

export const billingRoutes = new Elysia({ prefix: "/v1/billing" })
  .use(
    jwt({
      name: "jwt",
      secret: JWT_SECRET,
    })
  )
  .use(bearer())

  // 1. Get Plan Limits and Pricing Info
  .get("/plans", () => {
    return {
      success: true,
      plans: PLAN_LIMITS,
    };
  })

  // 2. Create Polar Checkout Session
  .post(
    "/checkout",
    async ({ bearer, jwt, body, set }) => {
      if (!bearer) {
        set.status = 401;
        return { success: false, error: "Missing authorization token" };
      }

      const payload = await jwt.verify(bearer);
      if (!payload || !payload.id) {
        set.status = 401;
        return { success: false, error: "Invalid session token" };
      }

      const user = await db.query.users.findFirst({
        where: eq(users.id, payload.id as string),
      });

      if (!user) {
        set.status = 404;
        return { success: false, error: "User not found" };
      }

      const checkoutUrl = await createPolarCheckoutSession({
        productId: body.productId,
        userId: user.id,
        userEmail: user.email,
        successUrl: body.successUrl || `${process.env.FRONTEND_URL || "http://localhost:5173"}/dashboard/settings?billing=success`,
      });

      if (!checkoutUrl) {
        set.status = 500;
        return { success: false, error: "Failed to generate Polar checkout link" };
      }

      return {
        success: true,
        checkoutUrl,
      };
    },
    {
      body: t.Object({
        productId: t.String(),
        successUrl: t.Optional(t.String()),
      }),
    }
  )

  // 3. Create Polar Customer Portal Session
  .post("/portal", async ({ bearer, jwt, set }) => {
    if (!bearer) {
      set.status = 401;
      return { success: false, error: "Missing authorization token" };
    }

    const payload = await jwt.verify(bearer);
    if (!payload || !payload.id) {
      set.status = 401;
      return { success: false, error: "Invalid session token" };
    }

    const sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, payload.id as string),
    });

    if (!sub || !sub.polarCustomerId) {
      set.status = 400;
      return { success: false, error: "No active Polar customer found for this account" };
    }

    const portalUrl = await createPolarPortalSession(sub.polarCustomerId);
    if (!portalUrl) {
      set.status = 500;
      return { success: false, error: "Failed to create Polar portal session" };
    }

    return { success: true, portalUrl };
  })

  // 4. Polar Webhook Receiver
  .post(
    "/webhook",
    async ({ body, headers, set }) => {
      const event = body as any;
      console.log(`🔔 [POLAR WEBHOOK] Received event: ${event.type}`);

      try {
        if (
          event.type === "subscription.created" ||
          event.type === "subscription.active" ||
          event.type === "subscription.updated"
        ) {
          const subData = event.data;
          const userId = subData.customer?.metadata?.userId || subData.metadata?.userId;
          const customerId = subData.customerId || subData.customer?.id;
          const productId = subData.productId || subData.product?.id;

          // Determine plan from product or custom metadata
          const planName: PlanTier = (subData.product?.name?.toLowerCase() as PlanTier) || "pro";
          const limits = PLAN_LIMITS[planName] || PLAN_LIMITS.pro;

          if (userId) {
            await db
              .insert(subscriptions)
              .values({
                userId,
                plan: planName,
                status: "active",
                monthlyEventLimit: limits.monthlyEventLimit,
                websiteLimit: limits.websiteLimit,
                polarCustomerId: customerId,
                polarSubscriptionId: subData.id,
                polarProductId: productId,
                currentPeriodStart: subData.currentPeriodStart ? new Date(subData.currentPeriodStart) : new Date(),
                currentPeriodEnd: subData.currentPeriodEnd ? new Date(subData.currentPeriodEnd) : null,
              })
              .onConflictDoUpdate({
                target: [subscriptions.userId],
                set: {
                  plan: planName,
                  status: "active",
                  monthlyEventLimit: limits.monthlyEventLimit,
                  websiteLimit: limits.websiteLimit,
                  polarCustomerId: customerId,
                  polarSubscriptionId: subData.id,
                  polarProductId: productId,
                  currentPeriodStart: subData.currentPeriodStart ? new Date(subData.currentPeriodStart) : new Date(),
                  currentPeriodEnd: subData.currentPeriodEnd ? new Date(subData.currentPeriodEnd) : null,
                  updatedAt: new Date(),
                },
              });

            console.log(`✅ Updated subscription for User ${userId} -> Plan: ${planName}`);
          }
        } else if (event.type === "subscription.canceled" || event.type === "subscription.revoked") {
          const subData = event.data;
          const userId = subData.customer?.metadata?.userId || subData.metadata?.userId;

          if (userId) {
            const freeLimits = PLAN_LIMITS.free;
            await db
              .update(subscriptions)
              .set({
                plan: "free",
                status: "canceled",
                monthlyEventLimit: freeLimits.monthlyEventLimit,
                websiteLimit: freeLimits.websiteLimit,
                updatedAt: new Date(),
              })
              .where(eq(subscriptions.userId, userId));

            console.log(`⚠️ Reverted User ${userId} back to Free tier due to cancellation`);
          }
        }

        return { received: true };
      } catch (err) {
        console.error("❌ Polar webhook processing error:", err);
        set.status = 500;
        return { error: "Webhook processing failed" };
      }
    }
  );
