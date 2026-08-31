import { Polar } from "@polar-sh/sdk";

const polarToken = process.env.POLAR_ACCESS_TOKEN;
export const polar = polarToken
  ? new Polar({
      accessToken: polarToken,
      server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
    })
  : null;

export const PLAN_LIMITS = {
  free: {
    name: "Free",
    monthlyEventLimit: 10_000,
    websiteLimit: 1,
    dataRetentionDays: 30,
  },
  pro: {
    name: "Pro",
    monthlyEventLimit: 250_000,
    websiteLimit: 10,
    dataRetentionDays: 365,
  },
  business: {
    name: "Business",
    monthlyEventLimit: 1_500_000,
    websiteLimit: 999,
    dataRetentionDays: 1095,
  },
  enterprise: {
    name: "Enterprise",
    monthlyEventLimit: 10_000_000,
    websiteLimit: 9999,
    dataRetentionDays: 1825,
  },
} as const;

export type PlanTier = keyof typeof PLAN_LIMITS;

export interface CreateCheckoutParams {
  productId: string;
  userId: string;
  userEmail: string;
  successUrl: string;
}

export async function createPolarCheckoutSession({
  productId,
  userId,
  userEmail,
  successUrl,
}: CreateCheckoutParams): Promise<string | null> {
  if (!polar) {
    console.warn("⚠️ Polar is not configured (missing POLAR_ACCESS_TOKEN). Returning mock checkout URL.");
    return `${successUrl}?mock_checkout=success&product_id=${productId}`;
  }

  try {
    const checkout = await polar.checkouts.create({
      products: [productId],
      customerEmail: userEmail,
      customerMetadata: {
        userId,
      },
      successUrl,
    });

    return checkout.url;
  } catch (error) {
    console.error("❌ Failed to create Polar checkout:", error);
    return null;
  }
}

export async function createPolarPortalSession(customerId: string): Promise<string | null> {
  if (!polar) {
    return null;
  }

  try {
    const session = await polar.customerSessions.create({
      customerId,
    });
    return session.customerPortalUrl;
  } catch (error) {
    console.error("❌ Failed to create Polar portal session:", error);
    return null;
  }
}
