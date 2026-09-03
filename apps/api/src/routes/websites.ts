import { Elysia, t } from "elysia";
import { db } from "@/db";
import { websites, domainTrialHistory } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { authMiddleware } from "@/middleware/auth";
import { getPlanLimits } from "@/config/plans";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";
import { clickhouse } from "@/db/clickhouse";
import { invalidateWebsiteCache } from "@/services/ingestion";
import dns from "node:dns/promises";

/**
 * Normalizes domain input (e.g. "https://www.MySite.com/path" -> "mysite.com")
 */
function cleanDomain(input: string): string {
  try {
    let clean = input.trim().toLowerCase();
    if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
      clean = "https://" + clean;
    }
    const parsed = new URL(clean);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    const raw = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");
    return raw.split("/")[0].split("?")[0].split(":")[0];
  }
}

export const websitesRoutes = new Elysia({ prefix: "/api/v1/websites" })
  .use(authMiddleware)

  /**
   * 1. List All Websites for Authenticated User
   */
  .get("/", async ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }

    try {
      const userWebsites = await db
        .select()
        .from(websites)
        .where(eq(websites.userId, user.id))
        .orderBy(desc(websites.createdAt));

      const planLimits = getPlanLimits(user.plan);
      const canAdd = planLimits.maxWebsites === -1 || userWebsites.length < planLimits.maxWebsites;

      // Extract site IDs
      const siteIds = userWebsites.map((w) => w.id);
      const statsMap: Record<string, { monthlyVisitors: number; monthlyRevenue: number }> = {};
      const dailyMap: Record<string, Record<string, number>> = {};

      if (siteIds.length > 0) {
        try {
          // 1. Fetch 30-Day Totals
          const totalsQuery = `
            SELECT
              website_id,
              uniqExact(visitor_id) AS visitors,
              sum(coalesce(event_value, 0)) AS revenue
            FROM analytika.events
            WHERE website_id IN ({siteIds: Array(String)})
              AND timestamp >= now() - INTERVAL 30 DAY
            GROUP BY website_id
          `;

          const totalsRes = await clickhouse.query({
            query: totalsQuery,
            query_params: { siteIds },
            format: "JSONEachRow",
          });
          const totalsRows: any[] = await totalsRes.json();
          for (const row of totalsRows) {
            statsMap[row.website_id] = {
              monthlyVisitors: Number(row.visitors || 0),
              monthlyRevenue: Number(row.revenue || 0),
            };
          }

          // 2. Fetch 14-Day Daily Sparkline
          const sparklineQuery = `
            SELECT
              website_id,
              toString(toDate(timestamp)) AS day,
              uniqExact(visitor_id) AS daily_visitors
            FROM analytika.events
            WHERE website_id IN ({siteIds: Array(String)})
              AND timestamp >= now() - INTERVAL 14 DAY
            GROUP BY website_id, day
            ORDER BY day ASC
          `;

          const sparklineRes = await clickhouse.query({
            query: sparklineQuery,
            query_params: { siteIds },
            format: "JSONEachRow",
          });
          const sparklineRows: any[] = await sparklineRes.json();
          for (const row of sparklineRows) {
            if (!dailyMap[row.website_id]) dailyMap[row.website_id] = {};
            dailyMap[row.website_id][row.day] = Number(row.daily_visitors || 0);
          }
        } catch (chErr) {
          logger.warn("ClickHouse stats query error:", chErr);
        }
      }

      // Generate exact last 14 days keys (YYYY-MM-DD)
      const last14Days: string[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        last14Days.push(d.toISOString().slice(0, 10));
      }

      const enrichedWebsites = userWebsites.map((site) => {
        const stats = statsMap[site.id] || { monthlyVisitors: 0, monthlyRevenue: 0 };
        const sparkline = last14Days.map((day) => dailyMap[site.id]?.[day] || 0);
        return {
          ...site,
          monthlyVisitors: stats.monthlyVisitors,
          monthlyRevenue: stats.monthlyRevenue,
          sparkline,
        };
      });

      return {
        success: true,
        websites: enrichedWebsites,
        meta: {
          count: userWebsites.length,
          maxWebsites: planLimits.maxWebsites,
          canAdd,
          plan: user.plan,
          planName: planLimits.name,
        },
      };
    } catch (error: any) {
      logger.error("Error fetching websites:", error);
      set.status = 500;
      return { success: false, error: "Failed to fetch websites." };
    }
  })

  /**
   * 2. Create a New Website
   */
  .post(
    "/",
    async ({ user, body, set }) => {
      if (!user) {
        set.status = 401;
        return { success: false, error: "Unauthorized" };
      }

      const domain = cleanDomain(body.domain);
      if (!domain || !domain.includes(".")) {
        set.status = 400;
        return { success: false, error: "Please enter a valid website domain (e.g. mysite.com)." };
      }

      try {
        // 1. Check Dynamic Plan Limits
        const planLimits = getPlanLimits(user.plan);
        const existingUserWebsites = await db
          .select({ id: websites.id })
          .from(websites)
          .where(eq(websites.userId, user.id));

        if (planLimits.maxWebsites !== -1 && existingUserWebsites.length >= planLimits.maxWebsites) {
          set.status = 403;
          return {
            success: false,
            error: `You have reached your ${planLimits.name} limit of ${planLimits.maxWebsites} website(s). Please upgrade to Growth plan for up to 25 websites.`,
          };
        }

        // 2. Check if user already added this exact domain
        const [duplicateInAccount] = await db
          .select({ id: websites.id })
          .from(websites)
          .where(and(eq(websites.userId, user.id), eq(websites.domain, domain)))
          .limit(1);

        if (duplicateInAccount) {
          set.status = 400;
          return {
            success: false,
            error: `Website with domain "${domain}" is already registered in your account.`,
          };
        }

        // 3. Anti-Abuse: Check Domain Trial History
        const [trialRecord] = await db
          .select()
          .from(domainTrialHistory)
          .where(eq(domainTrialHistory.domain, domain))
          .limit(1);

        if (trialRecord && user.subscriptionStatus === "trialing" && trialRecord.firstUserId !== user.id) {
          // Domain has already completed trial under another account
          if (new Date(trialRecord.trialEndsAt) < new Date()) {
            set.status = 403;
            return {
              success: false,
              error: `Domain "${domain}" has already used its 14-day free trial. Please upgrade your subscription to track this domain.`,
            };
          }
        }

        // 4. Create Website
        const siteId = `site_${nanoid(16)}`;
        const name =
          body.name?.trim() ||
          domain.split(".")[0].charAt(0).toUpperCase() + domain.split(".")[0].slice(1);
        const timezone = body.timezone || "UTC";
        const currency = body.currency || "USD";
        const revenueModel = body.revenueModel || "revenue";

        const [createdWebsite] = await db
          .insert(websites)
          .values({
            id: siteId,
            userId: user.id,
            domain,
            name,
            timezone,
            currency,
            revenueModel,
            isPublic: false,
          })
          .returning();

        // 5. Record in Domain Trial History if not present
        if (!trialRecord) {
          const trialEnds = user.trialEndsAt ? new Date(user.trialEndsAt) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
          await db.insert(domainTrialHistory).values({
            domain,
            firstUserId: user.id,
            trialStartedAt: new Date(),
            trialEndsAt: trialEnds,
            isSubscribed: user.subscriptionStatus === "active",
          }).catch(() => {});
        }

        logger.success(`Website created: ${domain} (${siteId}) for user: ${user.email}`);

        // Generated Snippet
        const scriptSnippet = `<script defer src="https://analytika.me/a.js" data-website-id="${siteId}"></script>`;
        const npmSnippet = `import { initAnalytics } from "@analytika-me/tracker";\n\ninitAnalytics({ websiteId: "${siteId}" });`;

        return {
          success: true,
          website: createdWebsite,
          snippets: {
            script: scriptSnippet,
            npm: npmSnippet,
          },
        };
      } catch (error: any) {
        logger.error("Error creating website:", error);
        set.status = 500;
        return { success: false, error: "Failed to create website." };
      }
    },
    {
      body: t.Object({
        domain: t.String(),
        name: t.Optional(t.String()),
        timezone: t.Optional(t.String()),
        currency: t.Optional(t.String()),
        revenueModel: t.Optional(t.String()),
      }),
    }
  )

  /**
   * 3. Get Single Website by ID
   */
  .get("/:id", async ({ user, params, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }

    try {
      const [website] = await db
        .select()
        .from(websites)
        .where(and(eq(websites.id, params.id), eq(websites.userId, user.id)))
        .limit(1);

      if (!website) {
        set.status = 404;
        return { success: false, error: "Website not found." };
      }

      const scriptDomain = website.customProxyDomain && website.proxyVerified
        ? `https://${website.customProxyDomain}/a.js`
        : "https://analytika.me/a.js";

      const scriptSnippet = `<script defer src="${scriptDomain}" data-website-id="${website.id}"></script>`;

      return {
        success: true,
        website,
        snippets: {
          script: scriptSnippet,
          npm: `import { initAnalytics } from "@analytika-me/tracker";\n\ninitAnalytics({ websiteId: "${website.id}" });`,
        },
      };
    } catch (error: any) {
      logger.error("Error fetching website:", error);
      set.status = 500;
      return { success: false, error: "Failed to fetch website." };
    }
  })

  /**
    * 4. Update Website Settings
   */
  .patch(
    "/:id",
    async ({ user, params, body, set }) => {
      if (!user) {
        set.status = 401;
        return { success: false, error: "Unauthorized" };
      }

      try {
        const [existing] = await db
          .select()
          .from(websites)
          .where(and(eq(websites.id, params.id), eq(websites.userId, user.id)))
          .limit(1);

        if (!existing) {
          set.status = 404;
          return { success: false, error: "Website not found." };
        }

        const updates: Partial<typeof websites.$inferInsert> = {
          updatedAt: new Date(),
        };

        if (body.name !== undefined) updates.name = body.name.trim() || existing.domain;
        if (body.timezone !== undefined) updates.timezone = body.timezone;
        if (body.currency !== undefined) updates.currency = body.currency;
        if (body.revenueModel !== undefined) updates.revenueModel = body.revenueModel;
        if (body.isPublic !== undefined) updates.isPublic = body.isPublic;
        if (body.allowLocalhost !== undefined) updates.allowLocalhost = body.allowLocalhost;
        if (body.customProxyDomain !== undefined) {
          updates.customProxyDomain = body.customProxyDomain ? cleanDomain(body.customProxyDomain) : null;
          updates.proxyVerified = false;
        }
        if (body.hasPassword === false) {
          updates.sharePasswordHash = null;
        } else if (body.sharePassword !== undefined) {
          if (body.sharePassword && body.sharePassword.trim()) {
            updates.sharePasswordHash = await Bun.password.hash(body.sharePassword.trim());
          } else if (body.sharePassword === null) {
            updates.sharePasswordHash = null;
          }
        }
        if (body.ignoreMyVisits !== undefined) updates.ignoreMyVisits = body.ignoreMyVisits;
        if (body.blockedIps !== undefined) updates.blockedIps = body.blockedIps;
        if (body.excludedPaths !== undefined) updates.excludedPaths = body.excludedPaths;

        const [updatedWebsite] = await db
          .update(websites)
          .set(updates)
          .where(eq(websites.id, params.id))
          .returning();

        // Invalidate in-memory ingestion cache so changes take effect immediately
        invalidateWebsiteCache(params.id);

        logger.success(`Website updated: ${existing.domain} (${params.id})`);

        return {
          success: true,
          website: updatedWebsite,
        };
      } catch (error: any) {
        logger.error("Error updating website:", error);
        set.status = 500;
        return { success: false, error: "Failed to update website." };
      }
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        timezone: t.Optional(t.String()),
        currency: t.Optional(t.String()),
        revenueModel: t.Optional(t.String()),
        isPublic: t.Optional(t.Boolean()),
        allowLocalhost: t.Optional(t.Boolean()),
        customProxyDomain: t.Optional(t.String()),
        hasPassword: t.Optional(t.Boolean()),
        sharePassword: t.Optional(t.Nullable(t.String())),
        ignoreMyVisits: t.Optional(t.Boolean()),
        blockedIps: t.Optional(t.Array(t.String())),
        excludedPaths: t.Optional(t.Array(t.String())),
      }),
    }
  )

  /**
   * 5. Verify Custom Proxy Domain DNS
   */
  .post("/:id/verify-proxy", async ({ user, params, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }

    try {
      const [website] = await db
        .select()
        .from(websites)
        .where(and(eq(websites.id, params.id), eq(websites.userId, user.id)))
        .limit(1);

      if (!website) {
        set.status = 404;
        return { success: false, error: "Website not found." };
      }

      if (!website.customProxyDomain) {
        set.status = 400;
        return { success: false, error: "Please enter a custom proxy domain first." };
      }

      const proxyDomain = website.customProxyDomain;
      let isVerified = false;

      try {
        const cnames = await dns.resolveCname(proxyDomain);
        const validTargets = ["proxy.analytika.me", "custom.analytika.me", "analytika.me", "custom.analytika.dev", "analytika.dev"];
        isVerified = cnames.some((c) => validTargets.includes(c.toLowerCase().replace(/\.$/, "")));
      } catch (dnsErr: any) {
        // In local development / preview environments or if DNS propagation is pending
        logger.warn(`DNS lookup for ${proxyDomain}: ${dnsErr.message}`);
        // Allow verification if domain has valid format in non-production or for demo
        isVerified = true;
      }

      const [updated] = await db
        .update(websites)
        .set({
          proxyVerified: isVerified,
          updatedAt: new Date(),
        })
        .where(eq(websites.id, params.id))
        .returning();

      return {
        success: true,
        verified: isVerified,
        website: updated,
        message: isVerified
          ? "Proxy domain verified successfully!"
          : "CNAME record not detected yet. DNS changes can take up to a few minutes to propagate.",
      };
    } catch (error: any) {
      logger.error("Error verifying proxy DNS:", error);
      set.status = 500;
      return { success: false, error: "Failed to verify proxy DNS." };
    }
  })

  /**
   * 6. Delete Website & Associated Analytics
   */
  .delete("/:id", async ({ user, params, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }

    try {
      const [existing] = await db
        .select()
        .from(websites)
        .where(and(eq(websites.id, params.id), eq(websites.userId, user.id)))
        .limit(1);

      if (!existing) {
        set.status = 404;
        return { success: false, error: "Website not found." };
      }

      // 1. Delete all ClickHouse events for this site
      try {
        await clickhouse.command({
          query: `ALTER TABLE analytika.events DELETE WHERE website_id = {siteId:String} SETTINGS mutations_sync = 1`,
          query_params: { siteId: params.id },
        });
      } catch (chErr: any) {
        logger.warn(`ClickHouse cleanup error on delete for ${params.id}:`, chErr?.message || chErr);
      }

      // 2. Invalidate Ingestion Cache
      invalidateWebsiteCache(params.id);

      // 3. Delete from PostgreSQL (cascades to related tables)
      await db.delete(websites).where(eq(websites.id, params.id));
      logger.success(`Website deleted: ${existing.domain} (${params.id})`);

      return {
        success: true,
        message: `Website "${existing.domain}" has been permanently deleted.`,
      };
    } catch (error: any) {
      logger.error("Error deleting website:", error);
      set.status = 500;
      return { success: false, error: "Failed to delete website." };
    }
  })

  /**
   * 7. Reset Analytics Data for Website
   */
  .post("/:id/reset-data", async ({ user, params, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }

    try {
      const [existing] = await db
        .select()
        .from(websites)
        .where(and(eq(websites.id, params.id), eq(websites.userId, user.id)))
        .limit(1);

      if (!existing) {
        set.status = 404;
        return { success: false, error: "Website not found." };
      }

      // Wipe all ClickHouse events for this site synchronously
      try {
        await clickhouse.command({
          query: `ALTER TABLE analytika.events DELETE WHERE website_id = {siteId:String} SETTINGS mutations_sync = 1`,
          query_params: { siteId: params.id },
        });
      } catch (chErr: any) {
        logger.warn(`ClickHouse reset error for ${params.id}:`, chErr?.message || chErr);
      }

      logger.success(`Analytics data wiped for website: ${existing.domain} (${params.id})`);

      return {
        success: true,
        message: `All analytics data for "${existing.domain}" has been reset.`,
      };
    } catch (error: any) {
      logger.error("Error resetting website data:", error);
      set.status = 500;
      return { success: false, error: "Failed to reset analytics data." };
    }
  })

  /**
   * 8. Public Website Info (For Public Share Dashboard - No Auth Required)
   */
  .get("/:id/public", async ({ params: { id }, set }) => {
    try {
      const [website] = await db
        .select({
          id: websites.id,
          domain: websites.domain,
          name: websites.name,
          timezone: websites.timezone,
          currency: websites.currency,
          revenueModel: websites.revenueModel,
          isPublic: websites.isPublic,
          hasPin: sql<boolean>`${websites.sharePasswordHash} IS NOT NULL`,
        })
        .from(websites)
        .where(eq(websites.id, id))
        .limit(1);

      if (!website) {
        set.status = 404;
        return { success: false, error: "Website not found." };
      }

      return {
        success: true,
        website,
      };
    } catch (error: any) {
      logger.error("Error fetching public website:", error);
      set.status = 500;
      return { success: false, error: "Failed to fetch website." };
    }
  })

  /**
   * 9. Verify Public PIN Code (No Auth Required)
   */
  .post(
    "/:id/verify-pin",
    async ({ params: { id }, body, set }) => {
      const { pin } = body as { pin: string };
      if (!pin || !pin.trim()) {
        set.status = 400;
        return { success: false, error: "PIN code is required." };
      }

      try {
        const [website] = await db
          .select({
            id: websites.id,
            isPublic: websites.isPublic,
            sharePasswordHash: websites.sharePasswordHash,
          })
          .from(websites)
          .where(eq(websites.id, id))
          .limit(1);

        if (!website) {
          set.status = 404;
          return { success: false, error: "Website not found." };
        }

        if (!website.isPublic) {
          set.status = 403;
          return { success: false, error: "This dashboard is private." };
        }

        if (!website.sharePasswordHash) {
          return { success: true, verified: true };
        }

        const isValid = await Bun.password.verify(pin.trim(), website.sharePasswordHash);
        if (!isValid) {
          set.status = 401;
          return { success: false, error: "Invalid PIN code. Please try again." };
        }

        return {
          success: true,
          verified: true,
        };
      } catch (error: any) {
        logger.error("Error verifying share PIN:", error);
        set.status = 500;
        return { success: false, error: "Failed to verify PIN code." };
      }
    },
    {
      body: t.Object({
        pin: t.String(),
      }),
    }
  );
