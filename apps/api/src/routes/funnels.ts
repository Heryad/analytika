import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { bearer } from "@elysiajs/bearer";
import { eq, and } from "drizzle-orm";
import { db } from "../db/client";
import { websites, funnels } from "../db/schema";
import { getClickHouseClient } from "../db/clickhouse";

const JWT_SECRET = process.env.JWT_SECRET || "analytika_super_secret_jwt_key_development_only";

interface FunnelStep {
  name: string;
  type: "pageview" | "event";
  path?: string;
  eventName?: string;
}

export const funnelRoutes = new Elysia({ prefix: "/v1/websites/:id/funnels" })
  .use(
    jwt({
      name: "jwt",
      secret: JWT_SECRET,
    })
  )
  .use(bearer())
  .derive(async ({ bearer, jwt, set, params }) => {
    if (!bearer) {
      set.status = 401;
      throw new Error("Missing authorization header");
    }
    const payload = await jwt.verify(bearer);
    if (!payload || !payload.id) {
      set.status = 401;
      throw new Error("Invalid session token");
    }

    const site = await db.query.websites.findFirst({
      where: and(eq(websites.id, params.id), eq(websites.userId, payload.id as string)),
    });
    if (!site) {
      set.status = 404;
      throw new Error("Website not found");
    }

    return { userId: payload.id as string, website: site };
  })

  // 1. List funnels
  .get("/", async ({ website }) => {
    const siteFunnels = await db.query.funnels.findMany({
      where: eq(funnels.websiteId, website.id),
    });

    return { success: true, funnels: siteFunnels };
  })

  // 2. Create funnel
  .post(
    "/",
    async ({ website, body }) => {
      const [newFunnel] = await db
        .insert(funnels)
        .values({
          websiteId: website.id,
          name: body.name.trim(),
          steps: body.steps,
        })
        .returning();

      return { success: true, funnel: newFunnel };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        steps: t.Array(
          t.Object({
            name: t.String(),
            type: t.Union([t.Literal("pageview"), t.Literal("event")]),
            path: t.Optional(t.String()),
            eventName: t.Optional(t.String()),
          })
        ),
      }),
    }
  )

  // 3. Compute Funnel Analytics via ClickHouse windowFunnel
  .get(
    "/:funnelId/stats",
    async ({ website, params, query, set }) => {
      const funnel = await db.query.funnels.findFirst({
        where: and(eq(funnels.id, params.funnelId), eq(funnels.websiteId, website.id)),
      });

      if (!funnel) {
        set.status = 404;
        return { success: false, error: "Funnel not found" };
      }

      const steps = funnel.steps as FunnelStep[];
      if (!steps || steps.length === 0) {
        return { success: true, results: [] };
      }

      const conditions = steps.map((step) => {
        if (step.type === "pageview" && step.path) {
          return `path = '${step.path.replace(/'/g, "\\'")}'`;
        } else if (step.eventName) {
          return `event_name = '${step.eventName.replace(/'/g, "\\'")}'`;
        }
        return "1 = 1";
      });

      const from = query.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const to = query.to || new Date().toISOString();

      try {
        const ch = getClickHouseClient();
        const sqlQuery = `
          SELECT
            level,
            count() AS reached_count
          FROM (
            SELECT
              session_id,
              windowFunnel(86400)(
                timestamp,
                ${conditions.join(", ")}
              ) AS level
            FROM events
            WHERE website_id = '${website.id}'
              AND timestamp >= '${from}'
              AND timestamp <= '${to}'
            GROUP BY session_id
          )
          GROUP BY level
          ORDER BY level ASC
        `;

        const result = await ch.query({
          query: sqlQuery,
          format: "JSONEachRow",
        });
        const rows = (await result.json()) as Array<{ level: number; reached_count: number | string }>;

        const levelCounts: Record<number, number> = {};
        for (const row of rows) {
          levelCounts[Number(row.level)] = Number(row.reached_count);
        }

        let totalSessionsStarted = 0;
        for (let l = 1; l <= steps.length; l++) {
          totalSessionsStarted += levelCounts[l] || 0;
        }

        const stepResults = steps.map((step, idx) => {
          const stepLevel = idx + 1;
          let count = 0;
          for (let l = stepLevel; l <= steps.length; l++) {
            count += levelCounts[l] || 0;
          }

          const conversionRate = totalSessionsStarted > 0 ? ((count / totalSessionsStarted) * 100).toFixed(1) : "0.0";

          return {
            step: stepLevel,
            name: step.name,
            type: step.type,
            count,
            conversionRate: parseFloat(conversionRate),
          };
        });

        return {
          success: true,
          funnel: {
            id: funnel.id,
            name: funnel.name,
            totalStarted: totalSessionsStarted,
            steps: stepResults,
          },
        };
      } catch (err) {
        console.error("❌ ClickHouse funnel error:", err);
        return {
          success: false,
          error: "Failed to compute funnel stats",
          fallbackSteps: steps.map((s, i) => ({ step: i + 1, name: s.name, count: 0, conversionRate: 0 })),
        };
      }
    },
    {
      query: t.Object({
        from: t.Optional(t.String()),
        to: t.Optional(t.String()),
      }),
    }
  )

  // 4. Delete funnel
  .delete("/:funnelId", async ({ website, params, set }) => {
    const funnel = await db.query.funnels.findFirst({
      where: and(eq(funnels.id, params.funnelId), eq(funnels.websiteId, website.id)),
    });

    if (!funnel) {
      set.status = 404;
      return { success: false, error: "Funnel not found" };
    }

    await db.delete(funnels).where(eq(funnels.id, funnel.id));
    return { success: true, message: "Funnel deleted" };
  });
