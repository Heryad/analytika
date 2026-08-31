import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { bearer } from "@elysiajs/bearer";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { websites } from "../db/schema";
import { getClickHouseClient } from "../db/clickhouse";

const JWT_SECRET = process.env.JWT_SECRET || "analytika_super_secret_jwt_key_development_only";

export const statsRoutes = new Elysia({ prefix: "/v1/websites/:id/stats" })
  .use(
    jwt({
      name: "jwt",
      secret: JWT_SECRET,
    })
  )
  .use(bearer())
  .derive(async ({ bearer, jwt, set, params }) => {
    const site = await db.query.websites.findFirst({
      where: eq(websites.id, params.id),
    });

    if (!site) {
      set.status = 404;
      throw new Error("Website not found");
    }

    if (!site.isPublic) {
      if (!bearer) {
        set.status = 401;
        throw new Error("Missing authorization header");
      }
      const payload = await jwt.verify(bearer);
      if (!payload || payload.id !== site.userId) {
        set.status = 403;
        throw new Error("Unauthorized access to website statistics");
      }
    }

    return { website: site };
  })

  // 1. Live Real-Time Active Visitors (Last 5 minutes)
  .get("/live", async ({ website }) => {
    try {
      const ch = getClickHouseClient();
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const countResult = await ch.query({
        query: `
          SELECT count(DISTINCT session_id) as online_count
          FROM events
          WHERE website_id = '${website.id}'
            AND timestamp >= '${fiveMinutesAgo}'
        `,
        format: "JSONEachRow",
      });
      const countRows = (await countResult.json()) as Array<{ online_count: number | string }>;
      const onlineCount = Number(countRows[0]?.online_count || 0);

      const feedResult = await ch.query({
        query: `
          SELECT event_name, event_type, path, referrer_domain, country, city, browser, os, timestamp
          FROM events
          WHERE website_id = '${website.id}'
            AND timestamp >= '${fiveMinutesAgo}'
          ORDER BY timestamp DESC
          LIMIT 10
        `,
        format: "JSONEachRow",
      });
      const feed = (await feedResult.json()) as any[];

      return {
        success: true,
        onlineCount,
        recentFeed: feed,
      };
    } catch (err) {
      return { success: true, onlineCount: 0, recentFeed: [] };
    }
  })

  // 2. Top KPI Cards & Summary
  .get(
    "/overview",
    async ({ website, query }) => {
      const from = query.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const to = query.to || new Date().toISOString();

      try {
        const ch = getClickHouseClient();

        const sql = `
          SELECT
            count(DISTINCT anonymous_id) as unique_visitors,
            count() as total_views,
            countIf(event_type = 'pageview') as pageviews,
            countIf(event_type = 'track') as custom_events,
            sum(revenue) as total_revenue,
            count(DISTINCT session_id) as total_sessions
          FROM events
          WHERE website_id = '${website.id}'
            AND timestamp >= '${from}'
            AND timestamp <= '${to}'
        `;

        const res = await ch.query({ query: sql, format: "JSONEachRow" });
        const rows = (await res.json()) as any[];
        const stats = rows[0] || {};

        const uniqueVisitors = Number(stats.unique_visitors || 0);
        const totalViews = Number(stats.total_views || 0);
        const pageviews = Number(stats.pageviews || 0);
        const customEvents = Number(stats.custom_events || 0);
        const totalRevenue = parseFloat(stats.total_revenue || 0);
        const totalSessions = Number(stats.total_sessions || 0);

        const bounceSql = `
          SELECT count() as single_event_sessions
          FROM (
            SELECT session_id, count() as evt_count
            FROM events
            WHERE website_id = '${website.id}'
              AND timestamp >= '${from}'
              AND timestamp <= '${to}'
            GROUP BY session_id
            HAVING evt_count = 1
          )
        `;
        const bounceRes = await ch.query({ query: bounceSql, format: "JSONEachRow" });
        const bounceRows = (await bounceRes.json()) as any[];
        const singleSessions = Number(bounceRows[0]?.single_event_sessions || 0);
        const bounceRate = totalSessions > 0 ? ((singleSessions / totalSessions) * 100).toFixed(1) : "0.0";
        const conversionRate = totalSessions > 0 ? ((customEvents / totalSessions) * 100).toFixed(1) : "0.0";

        return {
          success: true,
          kpi: {
            uniqueVisitors,
            totalViews,
            pageviews,
            customEvents,
            totalRevenue,
            totalSessions,
            bounceRate: parseFloat(bounceRate),
            conversionRate: parseFloat(conversionRate),
          },
        };
      } catch (err) {
        console.error("❌ ClickHouse overview error:", err);
        return {
          success: true,
          kpi: {
            uniqueVisitors: 0,
            totalViews: 0,
            pageviews: 0,
            customEvents: 0,
            totalRevenue: 0,
            totalSessions: 0,
            bounceRate: 0,
            conversionRate: 0,
          },
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

  // 3. Time Series Chart (Daily Data)
  .get(
    "/timeseries",
    async ({ website, query }) => {
      const from = query.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const to = query.to || new Date().toISOString();

      try {
        const ch = getClickHouseClient();
        const sql = `
          SELECT
            toDate(timestamp) as date,
            count(DISTINCT anonymous_id) as visitors,
            countIf(event_type = 'pageview') as pageviews,
            countIf(event_type = 'track') as events,
            sum(revenue) as revenue
          FROM events
          WHERE website_id = '${website.id}'
            AND timestamp >= '${from}'
            AND timestamp <= '${to}'
          GROUP BY date
          ORDER BY date ASC
        `;

        const res = await ch.query({ query: sql, format: "JSONEachRow" });
        const rows = await res.json();
        return { success: true, timeseries: rows };
      } catch (err) {
        return { success: true, timeseries: [] };
      }
    },
    {
      query: t.Object({
        from: t.Optional(t.String()),
        to: t.Optional(t.String()),
      }),
    }
  )

  // 4. Traffic Channels & Referrers
  .get(
    "/sources",
    async ({ website, query }) => {
      const from = query.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const to = query.to || new Date().toISOString();

      try {
        const ch = getClickHouseClient();

        const channelsRes = await ch.query({
          query: `
            SELECT channel, count() as views, count(DISTINCT anonymous_id) as visitors
            FROM events
            WHERE website_id = '${website.id}' AND timestamp >= '${from}' AND timestamp <= '${to}'
            GROUP BY channel
            ORDER BY views DESC
            LIMIT 10
          `,
          format: "JSONEachRow",
        });

        const referrersRes = await ch.query({
          query: `
            SELECT referrer_domain, count() as views, count(DISTINCT anonymous_id) as visitors
            FROM events
            WHERE website_id = '${website.id}' AND timestamp >= '${from}' AND timestamp <= '${to}'
              AND referrer_domain IS NOT NULL AND referrer_domain != ''
            GROUP BY referrer_domain
            ORDER BY views DESC
            LIMIT 15
          `,
          format: "JSONEachRow",
        });

        const campaignsRes = await ch.query({
          query: `
            SELECT utm_source, utm_medium, utm_campaign, count() as views, count(DISTINCT anonymous_id) as visitors
            FROM events
            WHERE website_id = '${website.id}' AND timestamp >= '${from}' AND timestamp <= '${to}'
              AND utm_campaign IS NOT NULL AND utm_campaign != ''
            GROUP BY utm_source, utm_medium, utm_campaign
            ORDER BY views DESC
            LIMIT 15
          `,
          format: "JSONEachRow",
        });

        return {
          success: true,
          channels: await channelsRes.json(),
          referrers: await referrersRes.json(),
          campaigns: await campaignsRes.json(),
        };
      } catch (err) {
        return { success: true, channels: [], referrers: [], campaigns: [] };
      }
    },
    {
      query: t.Object({
        from: t.Optional(t.String()),
        to: t.Optional(t.String()),
      }),
    }
  )

  // 5. Pages & Content
  .get(
    "/pages",
    async ({ website, query }) => {
      const from = query.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const to = query.to || new Date().toISOString();

      try {
        const ch = getClickHouseClient();

        const pagesRes = await ch.query({
          query: `
            SELECT path, count() as views, count(DISTINCT anonymous_id) as visitors
            FROM events
            WHERE website_id = '${website.id}' AND timestamp >= '${from}' AND timestamp <= '${to}'
            GROUP BY path
            ORDER BY views DESC
            LIMIT 20
          `,
          format: "JSONEachRow",
        });

        const entryPagesRes = await ch.query({
          query: `
            SELECT entry_page, count() as entries
            FROM events
            WHERE website_id = '${website.id}' AND timestamp >= '${from}' AND timestamp <= '${to}'
              AND entry_page IS NOT NULL AND entry_page != ''
            GROUP BY entry_page
            ORDER BY entries DESC
            LIMIT 10
          `,
          format: "JSONEachRow",
        });

        return {
          success: true,
          pages: await pagesRes.json(),
          entryPages: await entryPagesRes.json(),
        };
      } catch (err) {
        return { success: true, pages: [], entryPages: [] };
      }
    },
    {
      query: t.Object({
        from: t.Optional(t.String()),
        to: t.Optional(t.String()),
      }),
    }
  )

  // 6. Geolocation (Countries, Regions, Cities)
  .get(
    "/geo",
    async ({ website, query }) => {
      const from = query.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const to = query.to || new Date().toISOString();

      try {
        const ch = getClickHouseClient();

        const countriesRes = await ch.query({
          query: `
            SELECT country, count() as views, count(DISTINCT anonymous_id) as visitors
            FROM events
            WHERE website_id = '${website.id}' AND timestamp >= '${from}' AND timestamp <= '${to}'
              AND country IS NOT NULL AND country != ''
            GROUP BY country
            ORDER BY visitors DESC
            LIMIT 20
          `,
          format: "JSONEachRow",
        });

        const citiesRes = await ch.query({
          query: `
            SELECT country, city, count() as views, count(DISTINCT anonymous_id) as visitors
            FROM events
            WHERE website_id = '${website.id}' AND timestamp >= '${from}' AND timestamp <= '${to}'
              AND city IS NOT NULL AND city != ''
            GROUP BY country, city
            ORDER BY visitors DESC
            LIMIT 20
          `,
          format: "JSONEachRow",
        });

        return {
          success: true,
          countries: await countriesRes.json(),
          cities: await citiesRes.json(),
        };
      } catch (err) {
        return { success: true, countries: [], cities: [] };
      }
    },
    {
      query: t.Object({
        from: t.Optional(t.String()),
        to: t.Optional(t.String()),
      }),
    }
  )

  // 7. Technology (Browsers, OS, Devices)
  .get(
    "/devices",
    async ({ website, query }) => {
      const from = query.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const to = query.to || new Date().toISOString();

      try {
        const ch = getClickHouseClient();

        const browserRes = await ch.query({
          query: `
            SELECT browser, count() as views, count(DISTINCT anonymous_id) as visitors
            FROM events
            WHERE website_id = '${website.id}' AND timestamp >= '${from}' AND timestamp <= '${to}'
              AND browser IS NOT NULL
            GROUP BY browser
            ORDER BY visitors DESC
          `,
          format: "JSONEachRow",
        });

        const osRes = await ch.query({
          query: `
            SELECT os, count() as views, count(DISTINCT anonymous_id) as visitors
            FROM events
            WHERE website_id = '${website.id}' AND timestamp >= '${from}' AND timestamp <= '${to}'
              AND os IS NOT NULL
            GROUP BY os
            ORDER BY visitors DESC
          `,
          format: "JSONEachRow",
        });

        const deviceRes = await ch.query({
          query: `
            SELECT device_type, count() as views, count(DISTINCT anonymous_id) as visitors
            FROM events
            WHERE website_id = '${website.id}' AND timestamp >= '${from}' AND timestamp <= '${to}'
              AND device_type IS NOT NULL
            GROUP BY device_type
            ORDER BY visitors DESC
          `,
          format: "JSONEachRow",
        });

        return {
          success: true,
          browsers: await browserRes.json(),
          os: await osRes.json(),
          devices: await deviceRes.json(),
        };
      } catch (err) {
        return { success: true, browsers: [], os: [], devices: [] };
      }
    },
    {
      query: t.Object({
        from: t.Optional(t.String()),
        to: t.Optional(t.String()),
      }),
    }
  );
