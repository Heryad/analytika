import { Elysia, t } from "elysia";
import { db } from "@/db";
import { funnels, websites } from "@/db/schema";
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

export const funnelsRoutes = new Elysia({ prefix: "/api/v1/websites" })
  .use(authMiddleware)

  /**
   * 1. Get All Funnels for a Website with Real ClickHouse windowFunnel Aggregations
   */
  .get("/:id/funnels", async ({ params: { id: siteId }, query: { range, from: qFrom, to: qTo }, user, set }) => {
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
        return { success: false, error: "Unauthorized access to website funnels" };
      }

      // 2. Fetch configured funnels from PostgreSQL
      const dbFunnels = await db
        .select()
        .from(funnels)
        .where(eq(funnels.websiteId, siteId));

      const { from, to } = resolveTimeRange(range, qFrom, qTo);

      // 3. Compute live sequential funnel conversion using ClickHouse windowFunnel
      const liveFunnels = await Promise.all(
        dbFunnels.map(async (f) => {
          const rawSteps = (f.steps as any[]) || [];
          if (rawSteps.length === 0) {
            return {
              id: f.id,
              name: f.name,
              steps: [],
            };
          }

          // Build individual boolean conditions for each step
          const stepConditions = rawSteps.map((s) => {
            if (s.type === "page" || s.type === "pageview") {
              const cleanPath = (s.path || s.value || "/").replace(/'/g, "\\'");
              return `pathname = '${cleanPath}'`;
            } else {
              const cleanEvent = (s.eventId || s.value || s.name).replace(/'/g, "\\'");
              return `event_name = '${cleanEvent}'`;
            }
          });

          // Build SELECT column expressions: countIf(reached_step >= 1), countIf(reached_step >= 2), ...
          const selectCols = rawSteps
            .map((_, idx) => `countIf(reached_step >= ${idx + 1}) AS step_${idx + 1}_users`)
            .join(",\n");

          let countsByStep: number[] = rawSteps.map(() => 0);

          try {
            const funnelQuery = `
              SELECT
                ${selectCols}
              FROM (
                SELECT
                  visitor_id,
                  windowFunnel(86400)(
                    timestamp,
                    ${stepConditions.join(",\n")}
                  ) AS reached_step
                FROM analytika.events
                WHERE website_id = {siteId: String}
                  AND timestamp >= {from: String}
                  AND timestamp <= {to: String}
                GROUP BY visitor_id
              )
            `;

            const chRes = await clickhouse.query({
              query: funnelQuery,
              query_params: { siteId, from, to },
              format: "JSONEachRow",
            });

            const rows: any[] = await chRes.json();
            if (rows.length > 0) {
              countsByStep = rawSteps.map((_, idx) => Number(rows[0][`step_${idx + 1}_users`] || 0));
            }
          } catch (chErr) {
            logger.warn("ClickHouse windowFunnel query fallback", { error: chErr });
          }

          const baseCount = countsByStep[0] || 0;
          const computedSteps = await Promise.all(
            rawSteps.map(async (s, idx) => {
              const userCount = countsByStep[idx] || 0;
              const percentage = baseCount > 0 ? Math.round((userCount / baseCount) * 100) : 0;
              const prevCount = idx > 0 ? (countsByStep[idx - 1] || 0) : userCount;
              const dropOffRate = prevCount > 0 ? Math.max(0, Math.round(((prevCount - userCount) / prevCount) * 100)) : 0;

              const stepCondition = stepConditions[idx];
              let sources: { name: string; pct: string }[] = [];
              let countries: { name: string; code: string; pct: string }[] = [];
              let stepValue = "$0.00/visitor";

              if (userCount > 0) {
                try {
                  // Query Top Sources for this step
                  const srcRes = await clickhouse.query({
                    query: `
                      SELECT 
                        if(referrer_domain != '', referrer_domain, if(channel != '', channel, 'Direct / None')) AS source,
                        count() AS c
                      FROM analytika.events
                      WHERE website_id = {siteId: String}
                        AND ${stepCondition}
                        AND timestamp >= {from: String}
                        AND timestamp <= {to: String}
                      GROUP BY source
                      ORDER BY c DESC
                      LIMIT 3
                    `,
                    query_params: { siteId, from, to },
                    format: "JSONEachRow",
                  });
                  const srcRows: any[] = await srcRes.json();
                  const totalSrc = srcRows.reduce((sum, r) => sum + Number(r.c || 0), 0) || 1;
                  sources = srcRows.map((r) => ({
                    name: r.source,
                    pct: `${Math.round((Number(r.c || 0) / totalSrc) * 100)}%`,
                  }));

                  // Query Top Countries for this step
                  const ctryRes = await clickhouse.query({
                    query: `
                      SELECT 
                        country,
                        lower(country_code) AS code,
                        count() AS c
                      FROM analytika.events
                      WHERE website_id = {siteId: String}
                        AND ${stepCondition}
                        AND timestamp >= {from: String}
                        AND timestamp <= {to: String}
                      GROUP BY country, country_code
                      ORDER BY c DESC
                      LIMIT 3
                    `,
                    query_params: { siteId, from, to },
                    format: "JSONEachRow",
                  });
                  const ctryRows: any[] = await ctryRes.json();
                  const totalCtry = ctryRows.reduce((sum, r) => sum + Number(r.c || 0), 0) || 1;
                  countries = ctryRows.map((r) => ({
                    name: r.country || "Unknown",
                    code: r.code || "un",
                    pct: `${Math.round((Number(r.c || 0) / totalCtry) * 100)}%`,
                  }));

                  // Query Step Value (monetary)
                  const revRes = await clickhouse.query({
                    query: `
                      SELECT sum(event_value) AS rev
                      FROM analytika.events
                      WHERE website_id = {siteId: String}
                        AND ${stepCondition}
                        AND timestamp >= {from: String}
                        AND timestamp <= {to: String}
                    `,
                    query_params: { siteId, from, to },
                    format: "JSONEachRow",
                  });
                  const revRows: any[] = await revRes.json();
                  const revTotal = Number(revRows[0]?.rev || 0);
                  if (revTotal > 0) {
                    stepValue = `$${(revTotal / userCount).toFixed(2)}/visitor`;
                  }
                } catch (subErr) {
                  logger.error("Failed step drilldown sub-query", subErr);
                }
              }

              return {
                id: s.id || `step-${idx}`,
                name: s.name,
                type: s.type,
                path: s.path || s.value,
                eventId: s.eventId || s.value,
                users: userCount,
                percentage,
                dropOffRate,
                stepValue,
                sources,
                countries,
              };
            })
          );

          return {
            id: f.id,
            name: f.name,
            steps: computedSteps,
          };
        })
      );

      return {
        success: true,
        funnels: liveFunnels,
      };
    } catch (err: any) {
      logger.error("Failed to query funnels:", err);
      set.status = 500;
      return { success: false, error: "Failed to fetch funnels" };
    }
  })

  /**
   * 2. Create a New Funnel Pipeline
   */
  .post(
    "/:id/funnels",
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

        const newId = `f_${nanoid(12)}`;
        const [created] = await db
          .insert(funnels)
          .values({
            id: newId,
            websiteId: siteId,
            name: body.name.trim(),
            steps: body.steps,
          })
          .returning();

        return {
          success: true,
          funnel: created,
        };
      } catch (err: any) {
        logger.error("Failed to create funnel:", err);
        set.status = 500;
        return { success: false, error: "Failed to create funnel" };
      }
    },
    {
      body: t.Object({
        name: t.String(),
        steps: t.Array(
          t.Object({
            id: t.Optional(t.String()),
            name: t.String(),
            type: t.Union([t.Literal("page"), t.Literal("event"), t.Literal("pageview")]),
            path: t.Optional(t.String()),
            eventId: t.Optional(t.String()),
            condition: t.Optional(t.String()),
          })
        ),
      }),
    }
  )

  /**
   * 3. Update an Existing Funnel
   */
  .put(
    "/:id/funnels/:funnelId",
    async ({ params: { id: siteId, funnelId }, body, user, set }) => {
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

        const [updated] = await db
          .update(funnels)
          .set({
            name: body.name.trim(),
            steps: body.steps,
            updatedAt: new Date(),
          })
          .where(and(eq(funnels.id, funnelId), eq(funnels.websiteId, siteId)))
          .returning();

        return {
          success: true,
          funnel: updated,
        };
      } catch (err: any) {
        logger.error("Failed to update funnel:", err);
        set.status = 500;
        return { success: false, error: "Failed to update funnel" };
      }
    },
    {
      body: t.Object({
        name: t.String(),
        steps: t.Array(
          t.Object({
            id: t.Optional(t.String()),
            name: t.String(),
            type: t.Union([t.Literal("page"), t.Literal("event"), t.Literal("pageview")]),
            path: t.Optional(t.String()),
            eventId: t.Optional(t.String()),
            condition: t.Optional(t.String()),
          })
        ),
      }),
    }
  )

  /**
   * 4. Delete a Funnel
   */
  .delete("/:id/funnels/:funnelId", async ({ params: { id: siteId, funnelId }, user, set }) => {
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
        .delete(funnels)
        .where(and(eq(funnels.id, funnelId), eq(funnels.websiteId, siteId)));

      return { success: true };
    } catch (err: any) {
      logger.error("Failed to delete funnel:", err);
      set.status = 500;
      return { success: false, error: "Failed to delete funnel" };
    }
  });
