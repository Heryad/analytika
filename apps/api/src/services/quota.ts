import { eq, and, sql } from "drizzle-orm";
import { db } from "../db/client";
import { websites, subscriptions, monthlyUsage } from "../db/schema";

interface CachedSite {
  id: string;
  userId: string;
  domain: string;
  allowedOrigins: string[] | null;
  monthlyLimit: number;
  cachedAt: number;
}

// In-memory cache for API keys (60-second TTL) to ensure ultra-fast ingestion
const siteCache = new Map<string, CachedSite>();
const CACHE_TTL_MS = 60 * 1000;

export async function validateApiKey(apiKey: string, origin?: string | null): Promise<{
  valid: boolean;
  websiteId?: string;
  userId?: string;
  error?: string;
}> {
  const now = Date.now();
  let site = siteCache.get(apiKey);

  if (!site || now - site.cachedAt > CACHE_TTL_MS) {
    const foundSite = await db.query.websites.findFirst({
      where: eq(websites.apiKey, apiKey),
      with: {
        user: {
          with: {
            subscription: true,
          },
        },
      },
    });

    if (!foundSite) {
      return { valid: false, error: "Invalid API key" };
    }

    const monthlyLimit = foundSite.user.subscription?.monthlyEventLimit ?? 10_000;

    site = {
      id: foundSite.id,
      userId: foundSite.userId,
      domain: foundSite.domain,
      allowedOrigins: foundSite.allowedOrigins,
      monthlyLimit,
      cachedAt: now,
    };

    siteCache.set(apiKey, site);
  }

  // Origin check if configured
  if (site.allowedOrigins && site.allowedOrigins.length > 0 && origin) {
    try {
      const originHost = new URL(origin.startsWith("http") ? origin : `https://${origin}`).hostname;
      const isAllowed = site.allowedOrigins.some((allowed) => {
        return originHost === allowed || originHost.endsWith(`.${allowed}`);
      });
      if (!isAllowed) {
        return { valid: false, error: "Origin not allowed by website security settings" };
      }
    } catch {
      // Ignore origin parse error
    }
  }

  return {
    valid: true,
    websiteId: site.id,
    userId: site.userId,
  };
}

export async function incrementMonthlyUsage(
  userId: string,
  websiteId: string,
  pageviews: number,
  customEvents: number
): Promise<void> {
  const now = new Date();
  const yearMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const totalEvents = pageviews + customEvents;

  try {
    await db
      .insert(monthlyUsage)
      .values({
        userId,
        websiteId,
        yearMonth,
        eventCount: totalEvents,
        pageviewCount: pageviews,
        customEventCount: customEvents,
      })
      .onConflictDoUpdate({
        target: [monthlyUsage.websiteId, monthlyUsage.yearMonth],
        set: {
          eventCount: sql`${monthlyUsage.eventCount} + ${totalEvents}`,
          pageviewCount: sql`${monthlyUsage.pageviewCount} + ${pageviews}`,
          customEventCount: sql`${monthlyUsage.customEventCount} + ${customEvents}`,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error("❌ Failed to increment monthly usage:", error);
  }
}
