import { Elysia, t } from "elysia";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { websites } from "@/db/schema";
import { clickhouse } from "@/db/clickhouse";
import { authMiddleware } from "@/middleware/auth";
import { logger } from "@/lib/logger";
import { getSocialRadarMetrics } from "@/services/social-radar";

/**
 * Resolves timeframe string to UTC ISO date boundaries and grouping intervals
 */
function resolveTimeRange(
  range: string = "30d",
  customFrom?: string,
  customTo?: string
): { from: string; to: string; interval: "hour" | "day" | "month" } {
  const now = new Date();
  const to = customTo ? new Date(customTo).toISOString().slice(0, 19).replace("T", " ") : now.toISOString().slice(0, 19).replace("T", " ");

  if (customFrom) {
    const from = new Date(customFrom).toISOString().slice(0, 19).replace("T", " ");
    const diffHours = (new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60);
    return {
      from,
      to,
      interval: diffHours <= 48 ? "hour" : diffHours <= 24 * 60 ? "day" : "month",
    };
  }

  const normalized = range.toLowerCase().trim();

  if (normalized === "today") {
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    return {
      from: startOfDay.toISOString().slice(0, 19).replace("T", " "),
      to,
      interval: "hour",
    };
  }

  if (normalized === "24h" || normalized === "last 24h") {
    const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return {
      from: past24h.toISOString().slice(0, 19).replace("T", " "),
      to,
      interval: "hour",
    };
  }

  if (normalized === "7d" || normalized === "7 days") {
    const past7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return {
      from: past7d.toISOString().slice(0, 19).replace("T", " "),
      to,
      interval: "day",
    };
  }

  if (normalized === "12m" || normalized === "ytd" || normalized === "12 months") {
    const pastYear = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    return {
      from: pastYear.toISOString().slice(0, 19).replace("T", " "),
      to,
      interval: "month",
    };
  }

  if (normalized === "all") {
    return {
      from: "2020-01-01 00:00:00",
      to,
      interval: "month",
    };
  }

  // Default: 30 days
  const past30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return {
    from: past30d.toISOString().slice(0, 19).replace("T", " "),
    to,
    interval: "day",
  };
}

/**
 * Ensures user has permission to access website analytics
 */
async function verifyWebsiteAccess(websiteId: string, userId?: string): Promise<boolean> {
  try {
    const site = await db.query.websites.findFirst({
      where: eq(websites.id, websiteId),
      columns: { id: true, userId: true, isPublic: true },
    });

    if (!site) return false;
    if (site.isPublic) return true;
    if (userId && site.userId === userId) return true;

    return false;
  } catch {
    return false;
  }
}

export const analyticsRoutes = new Elysia({ prefix: "/api/v1/analytics" })
  .use(authMiddleware)

  /**
   * 1. Live Active Visitors (Last 5 Minutes)
   */
  .get("/:siteId/live", async ({ params: { siteId }, user, set }) => {
    const hasAccess = await verifyWebsiteAccess(siteId, user?.id);
    if (!hasAccess) {
      set.status = 403;
      return { success: false, error: "Unauthorized access to website analytics" };
    }

    try {
      const query = `
        SELECT uniqExact(visitor_id) AS online_visitors
        FROM analytika.events
        WHERE website_id = {siteId: String}
          AND timestamp >= now() - INTERVAL 5 MINUTE
      `;

      const result = await clickhouse.query({
        query,
        query_params: { siteId },
        format: "JSONEachRow",
      });

      const data: any[] = await result.json();
      const onlineVisitors = Number(data[0]?.online_visitors || 0);

      return {
        success: true,
        onlineVisitors,
      };
    } catch (err: any) {
      logger.error("Failed to fetch live analytics", { siteId, error: err });
      return { success: true, onlineVisitors: 0 };
    }
  })

  /**
   * 2. High-Level Overview Metrics (Visitors, Pageviews, Bounce Rate, Session Time, Revenue)
   */
  .get(
    "/:siteId/overview",
    async ({ params: { siteId }, query: { range, from: qFrom, to: qTo }, user, set }) => {
      const hasAccess = await verifyWebsiteAccess(siteId, user?.id);
      if (!hasAccess) {
        set.status = 403;
        return { success: false, error: "Unauthorized access to website analytics" };
      }

      const { from, to } = resolveTimeRange(range, qFrom, qTo);

      try {
        const query = `
          SELECT
            uniqExact(visitor_id) AS visitors,
            count() AS pageviews,
            uniqExact(session_id) AS sessions,
            countIf(event_name = 'purchase') AS purchases,
            sum(event_value) AS revenue
          FROM analytika.events
          WHERE website_id = {siteId: String}
            AND timestamp >= {from: String}
            AND timestamp <= {to: String}
        `;

        const result = await clickhouse.query({
          query,
          query_params: { siteId, from, to },
          format: "JSONEachRow",
        });

        const rows: any[] = await result.json();
        const row = rows[0] || {};

        const visitors = Number(row.visitors || 0);
        const pageviews = Number(row.pageviews || 0);
        const sessions = Number(row.sessions || 0);
        const purchases = Number(row.purchases || 0);
        const revenue = Number(row.revenue || 0);

        // Calculate bounce rate (single-event sessions)
        let bounceRate = 0;
        if (sessions > 0) {
          const bounceQuery = `
            SELECT countIf(event_count = 1) / count() * 100 AS bounce_rate
            FROM (
              SELECT session_id, count() AS event_count
              FROM analytika.events
              WHERE website_id = {siteId: String}
                AND timestamp >= {from: String}
                AND timestamp <= {to: String}
              GROUP BY session_id
            )
          `;
          const bounceRes = await clickhouse.query({
            query: bounceQuery,
            query_params: { siteId, from, to },
            format: "JSONEachRow",
          });
          const bRows: any[] = await bounceRes.json();
          bounceRate = Math.round(Number(bRows[0]?.bounce_rate || 0) * 10) / 10;
        }

        // Calculate average session duration in seconds
        let avgSessionDurationSeconds = 0;
        if (sessions > 0) {
          const durationQuery = `
            SELECT avg(session_duration) AS avg_duration
            FROM (
              SELECT session_id, dateDiff('second', min(timestamp), max(timestamp)) AS session_duration
              FROM analytika.events
              WHERE website_id = {siteId: String}
                AND timestamp >= {from: String}
                AND timestamp <= {to: String}
              GROUP BY session_id
            )
          `;
          try {
            const durRes = await clickhouse.query({
              query: durationQuery,
              query_params: { siteId, from, to },
              format: "JSONEachRow",
            });
            const durRows: any[] = await durRes.json();
            avgSessionDurationSeconds = Math.round(Number(durRows[0]?.avg_duration || 0));
          } catch {}
        }

        return {
          success: true,
          metrics: {
            visitors,
            pageviews,
            sessions,
            bounceRate,
            avgSessionDurationSeconds,
            revenue,
            purchases,
          },
          timeframe: { from, to, range },
        };
      } catch (err: any) {
        logger.error("Failed to fetch overview metrics", { siteId, error: err });
        set.status = 500;
        return { success: false, error: "Failed to query analytics" };
      }
    }
  )

  /**
   * 3. Timeseries Graph (Hourly / Daily / Monthly)
   */
  .get(
    "/:siteId/timeseries",
    async ({ params: { siteId }, query: { range, from: qFrom, to: qTo }, user, set }) => {
      const hasAccess = await verifyWebsiteAccess(siteId, user?.id);
      if (!hasAccess) {
        set.status = 403;
        return { success: false, error: "Unauthorized access to website analytics" };
      }

      const { from, to, interval } = resolveTimeRange(range, qFrom, qTo);

      try {
        const timeFunc =
          interval === "hour"
            ? "toStartOfHour(timestamp)"
            : interval === "month"
            ? "toStartOfMonth(timestamp)"
            : "toStartOfDay(timestamp)";

        const query = `
          SELECT
            ${timeFunc} AS bucket,
            uniqExact(visitor_id) AS visitors,
            count() AS pageviews,
            sum(event_value) AS revenue,
            uniqExactIf(visitor_id, first_seen >= bucket) AS newVisitors,
            uniqExactIf(visitor_id, first_seen < bucket) AS returningVisitors
          FROM (
            SELECT 
              e.visitor_id,
              e.timestamp,
              e.event_value,
              f.first_seen
            FROM analytika.events e
            ANY LEFT JOIN (
              SELECT visitor_id, min(timestamp) AS first_seen
              FROM analytika.events
              WHERE website_id = {siteId: String}
              GROUP BY visitor_id
            ) f ON e.visitor_id = f.visitor_id
            WHERE e.website_id = {siteId: String}
              AND e.timestamp >= {from: String}
              AND e.timestamp <= {to: String}
          )
          GROUP BY bucket
          ORDER BY bucket ASC
        `;

        const result = await clickhouse.query({
          query,
          query_params: { siteId, from, to },
          format: "JSONEachRow",
        });

        const rows: any[] = await result.json();
        const rowMap = new Map<string, { visitors: number; pageviews: number; revenue: number; newVisitors: number; returningVisitors: number }>();
        for (const r of rows) {
          const rawBucket = String(r.bucket);
          rowMap.set(rawBucket, {
            visitors: Number(r.visitors || 0),
            pageviews: Number(r.pageviews || 0),
            revenue: Number(r.revenue || 0),
            newVisitors: Number(r.newVisitors || 0),
            returningVisitors: Number(r.returningVisitors || 0),
          });
        }

        // Generate full continuous bucket timeline between from and to
        const buckets: { date: string; visitors: number; pageviews: number; revenue: number; newVisitors: number; returningVisitors: number }[] = [];
        const startDate = new Date(from);
        const endDate = new Date(to);

        if (interval === "hour") {
          const curr = new Date(startDate);
          curr.setMinutes(0, 0, 0);
          while (curr <= endDate) {
            const isoStr = curr.toISOString().slice(0, 13) + ":00:00";
            const spaceStr = isoStr.replace("T", " ");
            const matched = rowMap.get(isoStr) || rowMap.get(spaceStr);
            buckets.push({
              date: spaceStr,
              visitors: matched?.visitors || 0,
              pageviews: matched?.pageviews || 0,
              revenue: matched?.revenue || 0,
              newVisitors: matched?.newVisitors || 0,
              returningVisitors: matched?.returningVisitors || 0,
            });
            curr.setHours(curr.getHours() + 1);
          }
        } else if (interval === "day") {
          const curr = new Date(startDate);
          curr.setHours(0, 0, 0, 0);
          while (curr <= endDate) {
            const dateStr = curr.toISOString().slice(0, 10);
            const spaceStr = dateStr + " 00:00:00";
            const matched = rowMap.get(dateStr) || rowMap.get(spaceStr);
            buckets.push({
              date: dateStr,
              visitors: matched?.visitors || 0,
              pageviews: matched?.pageviews || 0,
              revenue: matched?.revenue || 0,
              newVisitors: matched?.newVisitors || 0,
              returningVisitors: matched?.returningVisitors || 0,
            });
            curr.setDate(curr.getDate() + 1);
          }
        } else {
          const curr = new Date(startDate);
          curr.setDate(1);
          curr.setHours(0, 0, 0, 0);
          while (curr <= endDate) {
            const dateStr = curr.toISOString().slice(0, 7);
            const spaceStr = dateStr + "-01 00:00:00";
            const matched = rowMap.get(dateStr) || rowMap.get(spaceStr);
            buckets.push({
              date: dateStr,
              visitors: matched?.visitors || 0,
              pageviews: matched?.pageviews || 0,
              revenue: matched?.revenue || 0,
              newVisitors: matched?.newVisitors || 0,
              returningVisitors: matched?.returningVisitors || 0,
            });
            curr.setMonth(curr.getMonth() + 1);
          }
        }

        return {
          success: true,
          timeseries: buckets.length > 0 ? buckets : rows,
          interval,
        };
      } catch (err: any) {
        logger.error("Failed to fetch timeseries", { siteId, error: err });
        set.status = 500;
        return { success: false, error: "Failed to query timeseries" };
      }
    }
  )

  /**
   * 4. Acquisition Sources (Channels, Referrers, UTM Campaigns)
   */
  .get(
    "/:siteId/sources",
    async ({ params: { siteId }, query: { range, from: qFrom, to: qTo }, user, set }) => {
      const hasAccess = await verifyWebsiteAccess(siteId, user?.id);
      if (!hasAccess) {
        set.status = 403;
        return { success: false, error: "Unauthorized access to website analytics" };
      }

      const { from, to } = resolveTimeRange(range, qFrom, qTo);

      try {
        // Channels
        const chRes = await clickhouse.query({
          query: `
            SELECT channel, uniqExact(visitor_id) AS visitors, count() AS pageviews
            FROM analytika.events
            WHERE website_id = {siteId: String} AND timestamp >= {from: String} AND timestamp <= {to: String}
            GROUP BY channel
            ORDER BY visitors DESC
            LIMIT 10
          `,
          query_params: { siteId, from, to },
          format: "JSONEachRow",
        });

        // Referrers
        const refRes = await clickhouse.query({
          query: `
            SELECT referrer_domain, uniqExact(visitor_id) AS visitors, count() AS pageviews
            FROM analytika.events
            WHERE website_id = {siteId: String} AND referrer_domain != '' AND timestamp >= {from: String} AND timestamp <= {to: String}
            GROUP BY referrer_domain
            ORDER BY visitors DESC
            LIMIT 20
          `,
          query_params: { siteId, from, to },
          format: "JSONEachRow",
        });

        // Campaigns
        const utmRes = await clickhouse.query({
          query: `
            SELECT utm_campaign, utm_source, uniqExact(visitor_id) AS visitors, count() AS pageviews
            FROM analytika.events
            WHERE website_id = {siteId: String} AND utm_campaign != '' AND timestamp >= {from: String} AND timestamp <= {to: String}
            GROUP BY utm_campaign, utm_source
            ORDER BY visitors DESC
            LIMIT 20
          `,
          query_params: { siteId, from, to },
          format: "JSONEachRow",
        });

        const channels: any[] = await chRes.json();
        const referrers: any[] = await refRes.json();
        const campaigns: any[] = await utmRes.json();

        return {
          success: true,
          channels: channels.map((c) => ({
            name: c.channel || "Direct",
            visitors: Number(c.visitors || 0),
            pageviews: Number(c.pageviews || 0),
          })),
          referrers: referrers.map((r) => ({
            name: r.referrer_domain,
            visitors: Number(r.visitors || 0),
            pageviews: Number(r.pageviews || 0),
          })),
          campaigns: campaigns.map((u) => ({
            name: u.utm_campaign,
            source: u.utm_source,
            visitors: Number(u.visitors || 0),
            pageviews: Number(u.pageviews || 0),
          })),
        };
      } catch (err: any) {
        logger.error("Failed to query sources", { siteId, error: err });
        set.status = 500;
        return { success: false, error: "Failed to query sources" };
      }
    }
  )

  /**
   * 5. Top Visited Pages
   */
  .get(
    "/:siteId/pages",
    async ({ params: { siteId }, query: { range, from: qFrom, to: qTo }, user, set }) => {
      const hasAccess = await verifyWebsiteAccess(siteId, user?.id);
      if (!hasAccess) {
        set.status = 403;
        return { success: false, error: "Unauthorized access to website analytics" };
      }

      const { from, to } = resolveTimeRange(range, qFrom, qTo);

      try {
        const result = await clickhouse.query({
          query: `
            SELECT pathname, any(page_title) AS title, uniqExact(visitor_id) AS visitors, count() AS pageviews
            FROM analytika.events
            WHERE website_id = {siteId: String} AND event_name = 'pageview' AND timestamp >= {from: String} AND timestamp <= {to: String}
            GROUP BY pathname
            ORDER BY pageviews DESC
            LIMIT 50
          `,
          query_params: { siteId, from, to },
          format: "JSONEachRow",
        });

        const rows: any[] = await result.json();
        return {
          success: true,
          pages: rows.map((r) => ({
            path: r.pathname,
            title: r.title || r.pathname,
            visitors: Number(r.visitors || 0),
            pageviews: Number(r.pageviews || 0),
          })),
        };
      } catch (err: any) {
        logger.error("Failed to query pages", { siteId, error: err });
        set.status = 500;
        return { success: false, error: "Failed to query pages" };
      }
    }
  )

  /**
   * 6. Geographic Breakdown (Countries, Cities, Regions)
   */
  .get(
    "/:siteId/geo",
    async ({ params: { siteId }, query: { range, from: qFrom, to: qTo }, user, set }) => {
      const hasAccess = await verifyWebsiteAccess(siteId, user?.id);
      if (!hasAccess) {
        set.status = 403;
        return { success: false, error: "Unauthorized access to website analytics" };
      }

      const { from, to } = resolveTimeRange(range, qFrom, qTo);

      try {
        const countryRes = await clickhouse.query({
          query: `
            SELECT country_code, uniqExact(visitor_id) AS visitors, count() AS pageviews
            FROM analytika.events
            WHERE website_id = {siteId: String} AND country_code != 'XX' AND country_code != '' AND timestamp >= {from: String} AND timestamp <= {to: String}
            GROUP BY country_code
            ORDER BY visitors DESC
            LIMIT 30
          `,
          query_params: { siteId, from, to },
          format: "JSONEachRow",
        });

        const regionRes = await clickhouse.query({
          query: `
            SELECT 
              if(region != '', region, 'Unknown') AS region_name, 
              country_code, 
              uniqExact(visitor_id) AS visitors, 
              count() AS pageviews
            FROM analytika.events
            WHERE website_id = {siteId: String} AND region != '' AND timestamp >= {from: String} AND timestamp <= {to: String}
            GROUP BY region_name, country_code
            ORDER BY visitors DESC
            LIMIT 30
          `,
          query_params: { siteId, from, to },
          format: "JSONEachRow",
        });

        const cityRes = await clickhouse.query({
          query: `
            SELECT 
              city, 
              country_code, 
              any(region) AS region, 
              uniqExact(visitor_id) AS visitors, 
              count() AS pageviews
            FROM analytika.events
            WHERE website_id = {siteId: String} AND city != '' AND timestamp >= {from: String} AND timestamp <= {to: String}
            GROUP BY city, country_code
            ORDER BY visitors DESC
            LIMIT 30
          `,
          query_params: { siteId, from, to },
          format: "JSONEachRow",
        });

        const langRes = await clickhouse.query({
          query: `
            SELECT 
              user_language AS code, 
              uniqExact(visitor_id) AS visitors, 
              count() AS pageviews
            FROM analytika.events
            WHERE website_id = {siteId: String} AND user_language != '' AND timestamp >= {from: String} AND timestamp <= {to: String}
            GROUP BY user_language
            ORDER BY visitors DESC
            LIMIT 20
          `,
          query_params: { siteId, from, to },
          format: "JSONEachRow",
        });

        const countries: any[] = await countryRes.json();
        const regions: any[] = await regionRes.json();
        const cities: any[] = await cityRes.json();
        const languages: any[] = await langRes.json();

        const regionNames =
          typeof Intl !== "undefined" && Intl.DisplayNames
            ? new Intl.DisplayNames(["en"], { type: "region" })
            : null;

        return {
          success: true,
          countries: countries.map((c) => {
            let countryName = c.country_code;
            try {
              if (regionNames && c.country_code) {
                countryName = regionNames.of(c.country_code) || c.country_code;
              }
            } catch {}
            return {
              code: c.country_code,
              name: countryName,
              visitors: Number(c.visitors || 0),
              pageviews: Number(c.pageviews || 0),
            };
          }),
          regions: regions.map((r) => ({
            name: r.region_name,
            country: r.country_code,
            visitors: Number(r.visitors || 0),
            pageviews: Number(r.pageviews || 0),
          })),
          cities: cities.map((ci) => ({
            name: ci.city,
            country: ci.country_code,
            region: ci.region,
            visitors: Number(ci.visitors || 0),
            pageviews: Number(ci.pageviews || 0),
          })),
          languages: languages.map((l) => ({
            code: l.code,
            name: l.code,
            visitors: Number(l.visitors || 0),
            pageviews: Number(l.pageviews || 0),
          })),
        };
      } catch (err: any) {
        logger.error("Failed to query geo", { siteId, error: err });
        set.status = 500;
        return { success: false, error: "Failed to query geography" };
      }
    }
  )

  /**
   * 7. Technology & Devices (Browsers, Operating Systems, Device Types, Screens)
   */
  .get(
    "/:siteId/devices",
    async ({ params: { siteId }, query: { range, from: qFrom, to: qTo }, user, set }) => {
      const hasAccess = await verifyWebsiteAccess(siteId, user?.id);
      if (!hasAccess) {
        set.status = 403;
        return { success: false, error: "Unauthorized access to website analytics" };
      }

      const { from, to } = resolveTimeRange(range, qFrom, qTo);

      try {
        const browserRes = await clickhouse.query({
          query: `
            SELECT browser, uniqExact(visitor_id) AS visitors, count() AS pageviews
            FROM analytika.events
            WHERE website_id = {siteId: String} AND browser != '' AND timestamp >= {from: String} AND timestamp <= {to: String}
            GROUP BY browser
            ORDER BY visitors DESC
            LIMIT 15
          `,
          query_params: { siteId, from, to },
          format: "JSONEachRow",
        });

        const osRes = await clickhouse.query({
          query: `
            SELECT os, uniqExact(visitor_id) AS visitors, count() AS pageviews
            FROM analytika.events
            WHERE website_id = {siteId: String} AND os != '' AND timestamp >= {from: String} AND timestamp <= {to: String}
            GROUP BY os
            ORDER BY visitors DESC
            LIMIT 15
          `,
          query_params: { siteId, from, to },
          format: "JSONEachRow",
        });

        const deviceRes = await clickhouse.query({
          query: `
            SELECT device_type, uniqExact(visitor_id) AS visitors, count() AS pageviews
            FROM analytika.events
            WHERE website_id = {siteId: String} AND device_type != '' AND timestamp >= {from: String} AND timestamp <= {to: String}
            GROUP BY device_type
            ORDER BY visitors DESC
          `,
          query_params: { siteId, from, to },
          format: "JSONEachRow",
        });

        const screenRes = await clickhouse.query({
          query: `
            SELECT 
              concat(toString(screen_width), 'x', toString(screen_height)) AS screen_res, 
              uniqExact(visitor_id) AS visitors, 
              count() AS pageviews
            FROM analytika.events
            WHERE website_id = {siteId: String} AND screen_width > 0 AND timestamp >= {from: String} AND timestamp <= {to: String}
            GROUP BY screen_res
            ORDER BY visitors DESC
            LIMIT 15
          `,
          query_params: { siteId, from, to },
          format: "JSONEachRow",
        });

        const loyaltyRes = await clickhouse.query({
          query: `
            SELECT 
              countIf(first_seen >= {from: String}) AS new_visitors,
              countIf(first_seen < {from: String}) AS returning_visitors
            FROM (
              SELECT 
                visitor_id, 
                min(timestamp) AS first_seen,
                sum(if(timestamp >= {from: String} AND timestamp <= {to: String}, 1, 0)) AS visits_in_range
              FROM analytika.events
              WHERE website_id = {siteId: String}
              GROUP BY visitor_id
              HAVING visits_in_range > 0
            )
          `,
          query_params: { siteId, from, to },
          format: "JSONEachRow",
        });

        const browsers: any[] = await browserRes.json();
        const osList: any[] = await osRes.json();
        const devices: any[] = await deviceRes.json();
        const screens: any[] = await screenRes.json();
        const loyaltyRows: any[] = await loyaltyRes.json();
        const lRow = loyaltyRows[0] || {};

        return {
          success: true,
          browsers: browsers.map((b) => ({
            name: b.browser,
            visitors: Number(b.visitors || 0),
            pageviews: Number(b.pageviews || 0),
          })),
          os: osList.map((o) => ({
            name: o.os,
            visitors: Number(o.visitors || 0),
            pageviews: Number(o.pageviews || 0),
          })),
          devices: devices.map((d) => ({
            name: d.device_type,
            visitors: Number(d.visitors || 0),
            pageviews: Number(d.pageviews || 0),
          })),
          screens: screens.map((s) => ({
            name: s.screen_res,
            visitors: Number(s.visitors || 0),
            pageviews: Number(s.pageviews || 0),
          })),
          loyalty: {
            newVisitors: Number(lRow.new_visitors || 0),
            returningVisitors: Number(lRow.returning_visitors || 0),
          },
        };
      } catch (err: any) {
        logger.error("Failed to query devices", { siteId, error: err });
        set.status = 500;
        return { success: false, error: "Failed to query devices" };
      }
    }
  )

  /**
   * 8. Custom Events Breakdown & Conversions
   */
  .get(
    "/:siteId/events",
    async ({ params: { siteId }, query: { range, from: qFrom, to: qTo }, user, set }) => {
      const hasAccess = await verifyWebsiteAccess(siteId, user?.id);
      if (!hasAccess) {
        set.status = 403;
        return { success: false, error: "Unauthorized access to website analytics" };
      }

      const { from, to } = resolveTimeRange(range, qFrom, qTo);

      try {
        const result = await clickhouse.query({
          query: `
            SELECT
              event_name,
              count() AS total_count,
              uniqExact(visitor_id) AS unique_visitors,
              sum(event_value) AS total_value,
              any(event_currency) AS currency
            FROM analytika.events
            WHERE website_id = {siteId: String}
              AND event_name != 'pageview'
              AND timestamp >= {from: String}
              AND timestamp <= {to: String}
            GROUP BY event_name
            ORDER BY total_count DESC
            LIMIT 50
          `,
          query_params: { siteId, from, to },
          format: "JSONEachRow",
        });

        const rows: any[] = await result.json();
        return {
          success: true,
          events: rows.map((e) => ({
            name: e.event_name,
            totalCount: Number(e.total_count || 0),
            uniqueVisitors: Number(e.unique_visitors || 0),
            totalValue: Number(e.total_value || 0),
            currency: e.currency || "USD",
          })),
        };
      } catch (err: any) {
        logger.error("Failed to query custom events", { siteId, error: err });
        set.status = 500;
        return { success: false, error: "Failed to query custom events" };
      }
    }
  )

  /**
   * 11. Social Radar (X & Reddit Domain Mention Timeseries & Live Posts)
   */
  .get(
    "/:siteId/social-radar",
    async ({ user, params: { siteId }, query, set }) => {
      if (!user) {
        set.status = 401;
        return { success: false, error: "Unauthorized" };
      }

      try {
        const [website] = await db
          .select({
            id: websites.id,
            domain: websites.domain,
            userId: websites.userId,
          })
          .from(websites)
          .where(and(eq(websites.id, siteId), eq(websites.userId, user.id)))
          .limit(1);

        if (!website) {
          set.status = 404;
          return { success: false, error: "Website not found." };
        }

        const timeRange = (query.timeRange as string) || "30 Days";
        const radarData = await getSocialRadarMetrics({
          websiteId: website.id,
          domain: website.domain,
          timeRange,
        });

        return {
          success: true,
          domain: website.domain,
          planRestricted: !user.hasSocialRadar,
          ...radarData,
        };
      } catch (err: any) {
        logger.error("Failed to fetch social radar data:", err);
        set.status = 500;
        return { success: false, error: "Failed to fetch social radar" };
      }
    },
    {
      query: t.Object({
        timeRange: t.Optional(t.String()),
      }),
    }
  );
