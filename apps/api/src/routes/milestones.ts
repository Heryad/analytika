import { Elysia, t } from "elysia";
import { db } from "@/db";
import { milestones, websites } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "@/middleware/auth";
import { clickhouse } from "@/db/clickhouse";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";

function resolveTimeRange(range?: string, qFrom?: string, qTo?: string) {
  const now = new Date();
  let from = new Date();
  let to = now;

  if (qFrom && qTo) {
    from = new Date(qFrom);
    to = new Date(qTo);
  } else {
    switch (range) {
      case "24h":
      case "today":
        from.setHours(from.getHours() - 24);
        break;
      case "7d":
        from.setDate(from.getDate() - 7);
        break;
      case "30d":
      default:
        from.setDate(from.getDate() - 30);
        break;
      case "90d":
        from.setDate(from.getDate() - 90);
        break;
      case "12m":
        from.setFullYear(from.getFullYear() - 1);
        break;
    }
  }

  return {
    from: from.toISOString().replace("T", " ").replace("Z", "").slice(0, 19),
    to: to.toISOString().replace("T", " ").replace("Z", "").slice(0, 19),
  };
}

export const milestonesRoutes = new Elysia({ prefix: "/api/v1/websites" })
  .use(authMiddleware)

  /**
   * 1. Get All Milestones for a Website with Live ClickHouse Aggregations
   */
  .get("/:id/milestones", async ({ params: { id: siteId }, query: { range, from: qFrom, to: qTo }, user, set }) => {
    try {
      // 1. Verify access (owner or public)
      const [site] = await db
        .select()
        .from(websites)
        .where(eq(websites.id, siteId))
        .limit(1);

      if (!site) {
        set.status = 404;
        return { success: false, error: "Website not found" };
      }

      if (!site.isPublic && (!user || site.userId !== user.id)) {
        set.status = 403;
        return { success: false, error: "Unauthorized access to website milestones" };
      }

      // 2. Fetch milestone configurations from PostgreSQL
      const configuredMilestones = await db
        .select()
        .from(milestones)
        .where(eq(milestones.websiteId, siteId));

      const { from, to } = resolveTimeRange(range, qFrom, qTo);

      // 3. Get total site visitors for conversion rate denominator
      const totalVisRes = await clickhouse.query({
        query: `
          SELECT uniqExact(visitor_id) AS total_visitors
          FROM analytika.events
          WHERE website_id = {siteId: String}
            AND timestamp >= {from: String}
            AND timestamp <= {to: String}
        `,
        query_params: { siteId, from, to },
        format: "JSONEachRow",
      });

      const totalVisRows: any[] = await totalVisRes.json();
      const totalVisitors = Number(totalVisRows[0]?.total_visitors || 0) || 1;

      // 4. Compute live metrics for each milestone
      const liveMilestones = await Promise.all(
        configuredMilestones.map(async (m) => {
          const isPageview = m.type === "pageview";
          const filterClause = isPageview ? "pathname = {trigger: String}" : "event_name = {trigger: String}";

          // Completions & unique converters query
          const statRes = await clickhouse.query({
            query: `
              SELECT 
                count() AS completions,
                uniqExact(visitor_id) AS converted_visitors,
                sum(event_value) AS total_revenue
              FROM analytika.events
              WHERE website_id = {siteId: String}
                AND ${filterClause}
                AND timestamp >= {from: String}
                AND timestamp <= {to: String}
            `,
            query_params: { siteId, trigger: m.trigger, from, to },
            format: "JSONEachRow",
          });

          const statRows: any[] = await statRes.json();
          const stat = statRows[0] || {};
          const completions = Number(stat.completions || 0);
          const convertedVisitors = Number(stat.converted_visitors || 0);
          const rawRevenue = Number(stat.total_revenue || 0);
          const revenue = rawRevenue > 0 ? rawRevenue : completions * (m.revenuePerCompletion || 0);
          const conversionRate = Math.round((convertedVisitors / totalVisitors) * 1000) / 10;

          // Top traffic driver
          const topDriverRes = await clickhouse.query({
            query: `
              SELECT 
                if(referrer_domain != '', referrer_domain, if(channel != '', channel, 'Direct')) AS source,
                count() AS source_completions
              FROM analytika.events
              WHERE website_id = {siteId: String}
                AND ${filterClause}
                AND timestamp >= {from: String}
                AND timestamp <= {to: String}
              GROUP BY source
              ORDER BY source_completions DESC
              LIMIT 1
            `,
            query_params: { siteId, trigger: m.trigger, from, to },
            format: "JSONEachRow",
          });

          const topRows: any[] = await topDriverRes.json();
          const topSource = topRows[0] ? {
            name: topRows[0].source,
            rate: Math.min(100, Math.round((Number(topRows[0].source_completions || 0) / (completions || 1)) * 100)),
          } : { name: "Direct", rate: 100 };

          return {
            id: m.id,
            name: m.name,
            type: m.type as "event" | "pageview" | "revenue",
            trigger: isPageview ? `Page: ${m.trigger}` : `Event: ${m.trigger}`,
            rawTrigger: m.trigger,
            completions,
            conversionRate,
            targetCount: m.targetCount,
            revenue,
            topSource,
            trend: 0,
          };
        })
      );

      return {
        success: true,
        milestones: liveMilestones,
      };
    } catch (err: any) {
      logger.error("Failed to query milestones:", err);
      set.status = 500;
      return { success: false, error: "Failed to fetch milestones" };
    }
  })

  /**
   * 2. Create a New Milestone Target
   */
  .post(
    "/:id/milestones",
    async ({ params: { id: siteId }, body, user, set }) => {
      if (!user) {
        set.status = 401;
        return { success: false, error: "Unauthorized" };
      }

      try {
        const [site] = await db
          .select()
          .from(websites)
          .where(and(eq(websites.id, siteId), eq(websites.userId, user.id)))
          .limit(1);

        if (!site) {
          set.status = 404;
          return { success: false, error: "Website not found" };
        }

        const newId = `m_${nanoid(12)}`;
        const [created] = await db
          .insert(milestones)
          .values({
            id: newId,
            websiteId: siteId,
            name: body.name.trim(),
            type: body.type || "event",
            trigger: body.trigger.trim(),
            targetCount: Number(body.targetCount) || 1000,
            revenuePerCompletion: Number(body.revenuePerCompletion) || 0,
          })
          .returning();

        return {
          success: true,
          milestone: created,
        };
      } catch (err: any) {
        logger.error("Failed to create milestone:", err);
        set.status = 500;
        return { success: false, error: "Failed to create milestone" };
      }
    },
    {
      body: t.Object({
        name: t.String(),
        type: t.Union([t.Literal("event"), t.Literal("pageview"), t.Literal("revenue")]),
        trigger: t.String(),
        targetCount: t.Number(),
        revenuePerCompletion: t.Optional(t.Number()),
      }),
    }
  )

  /**
   * 3. Delete a Milestone
   */
  .delete("/:id/milestones/:milestoneId", async ({ params: { id: siteId, milestoneId }, user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }

    try {
      const [site] = await db
        .select()
        .from(websites)
        .where(and(eq(websites.id, siteId), eq(websites.userId, user.id)))
        .limit(1);

      if (!site) {
        set.status = 404;
        return { success: false, error: "Website not found" };
      }

      await db
        .delete(milestones)
        .where(and(eq(milestones.id, milestoneId), eq(milestones.websiteId, siteId)));

      return { success: true };
    } catch (err: any) {
      logger.error("Failed to delete milestone:", err);
      set.status = 500;
      return { success: false, error: "Failed to delete milestone" };
    }
  });
