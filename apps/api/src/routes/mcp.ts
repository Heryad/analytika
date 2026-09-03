import { Elysia, t } from "elysia";
import { db } from "@/db";
import { websites } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { clickhouse } from "@/db/clickhouse";
import { logger } from "@/lib/logger";
import { getSocialRadarMetrics } from "@/services/social-radar";
import { authenticateMcpBearer, mcpPathFromRequestUrl, wwwAuthenticateHeader } from "@/lib/oauth";

/**
 * Resolves standard date boundaries for queries
 */
function resolveTimeRangeDates(range: string = "30 Days"): { from: string; to: string } {
  const now = new Date();
  const toStr = now.toISOString().replace("T", " ").slice(0, 19);
  let fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const normalized = range.toLowerCase().trim();
  if (normalized === "today") {
    fromDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
  } else if (normalized === "last 24h" || normalized === "24h") {
    fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  } else if (normalized === "7 days" || normalized === "7d") {
    fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (normalized === "ytd") {
    fromDate = new Date(now.getFullYear(), 0, 1);
  }

  const fromStr = fromDate.toISOString().replace("T", " ").slice(0, 19);
  return { from: fromStr, to: toStr };
}

/**
 * Standard MCP Tool Definitions
 */
const MCP_TOOLS = [
  {
    name: "list_websites",
    description: "List all websites tracked in Analytika for the authenticated user, including their IDs, domains, and settings.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_realtime_visitors",
    description: "Get real-time online active visitors in the last 5 minutes and currently active page URLs for a website.",
    inputSchema: {
      type: "object",
      properties: {
        websiteId: {
          type: "string",
          description: "Optional website ID. If omitted, the user's primary website is automatically used.",
        },
      },
    },
  },
  {
    name: "get_overview_metrics",
    description: "Get high-level summary metrics (Unique Visitors, Pageviews, Revenue/MRR, Bounce Rate, Avg Session Duration) over a chosen timeframe.",
    inputSchema: {
      type: "object",
      properties: {
        websiteId: {
          type: "string",
          description: "Optional website ID. If omitted, the primary website is used.",
        },
        timeRange: {
          type: "string",
          description: "Timeframe for analysis: 'Today', 'Last 24h', '7 Days', '30 Days', or 'YTD'. Defaults to '30 Days'.",
        },
      },
    },
  },
  {
    name: "get_traffic_sources",
    description: "Get top acquisition traffic channels, referring websites, search engines, and UTM marketing campaigns sorted by volume and conversions.",
    inputSchema: {
      type: "object",
      properties: {
        websiteId: {
          type: "string",
          description: "Optional website ID.",
        },
        timeRange: {
          type: "string",
          description: "Timeframe: 'Today', 'Last 24h', '7 Days', '30 Days', 'YTD'.",
        },
        limit: {
          type: "number",
          description: "Number of rows to return (default 10).",
        },
      },
    },
  },
  {
    name: "get_revenue_attribution",
    description: "Get revenue attribution breakdown: shows which marketing channels, referrers, and landing pages generated paying customers.",
    inputSchema: {
      type: "object",
      properties: {
        websiteId: {
          type: "string",
          description: "Optional website ID.",
        },
        timeRange: {
          type: "string",
          description: "Timeframe: 'Today', 'Last 24h', '7 Days', '30 Days', 'YTD'.",
        },
      },
    },
  },
  {
    name: "get_social_radar",
    description: "Get discovered social mentions across X (Twitter) and Reddit for the website's domain, community discussions, and attributed referral traffic.",
    inputSchema: {
      type: "object",
      properties: {
        websiteId: {
          type: "string",
          description: "Optional website ID.",
        },
        timeRange: {
          type: "string",
          description: "Timeframe: 'Today', 'Last 24h', '7 Days', '30 Days', 'YTD'.",
        },
      },
    },
  },
  {
    name: "get_top_pages",
    description: "Get top visited page paths, views, unique visitors, and average time on page.",
    inputSchema: {
      type: "object",
      properties: {
        websiteId: {
          type: "string",
          description: "Optional website ID.",
        },
        timeRange: {
          type: "string",
          description: "Timeframe: 'Today', 'Last 24h', '7 Days', '30 Days', 'YTD'.",
        },
        limit: {
          type: "number",
          description: "Number of pages to return (default 10).",
        },
      },
    },
  },
];

const SUPPORTED_PROTOCOL_VERSIONS = ["2025-11-25", "2025-03-26", "2024-11-05"];

function applyUnauthorized(set: any, requestUrl: string, error?: string) {
  const path = mcpPathFromRequestUrl(requestUrl);
  set.status = 401;
  set.headers["WWW-Authenticate"] = wwwAuthenticateHeader(path, error);
  set.headers["Access-Control-Expose-Headers"] = "WWW-Authenticate, MCP-Session-Id";
  set.headers["Cache-Control"] = "no-store";
}

async function resolveMcpUser(headers: Record<string, string | undefined>, set: any, requestUrl: string) {
  const authHeader = headers["authorization"] || "";
  let token = "";
  if (authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else if (authHeader && !authHeader.toLowerCase().startsWith("basic ")) {
    token = authHeader.trim();
  }

  if (!token) {
    applyUnauthorized(set, requestUrl);
    return null;
  }

  const user = await authenticateMcpBearer(token);
  if (!user) {
    applyUnauthorized(set, requestUrl, "invalid_token");
    return null;
  }

  return user;
}

/**
 * Remote Model Context Protocol (MCP) Server Handler
 * Streamable HTTP + OAuth 2.1 for Claude, ChatGPT, Cursor
 */
const mcpHandler = new Elysia()
  /**
   * Unauthenticated GET is the OAuth discovery probe (must be HTTP 401, not 200).
   * Authenticated GET: this server does not expose a standalone SSE stream.
   */
  .get("/", async ({ headers, set, request }) => {
    const user = await resolveMcpUser(headers, set, request.url);
    if (!user) {
      return {
        error: "unauthorized",
        error_description: "Authorization required. Connect with OAuth or an Analytika MCP token.",
      };
    }

    set.status = 405;
    return {
      error: "method_not_allowed",
      error_description: "This MCP server uses Streamable HTTP POST. SSE GET is not offered.",
    };
  })

  .delete("/", ({ set }) => {
    set.status = 405;
    return { error: "method_not_allowed" };
  })

  /**
   * Main MCP JSON-RPC Handler (POST)
   */
  .post("/", async ({ body, headers, set, request }) => {
    const user = await resolveMcpUser(headers, set, request.url);
    if (!user) {
      return {
        error: "invalid_token",
        error_description: "Missing or invalid access token.",
      };
    }

    const payload = body as any;
    const method = payload?.method || "";
    const id = payload?.id;
    const isNotification = typeof method === "string" && method.length > 0 && !("id" in (payload || {}));

    if (isNotification || method.startsWith("notifications/")) {
      set.status = 202;
      return;
    }

    // Helper: resolve target website for user
    const resolveWebsite = async (siteId?: string) => {
      const userSites = await db
        .select()
        .from(websites)
        .where(eq(websites.userId, user.id))
        .orderBy(desc(websites.createdAt));

      if (userSites.length === 0) return null;
      if (!siteId) return userSites[0];
      return userSites.find((s) => s.id === siteId || s.domain.toLowerCase() === siteId.toLowerCase()) || userSites[0];
    };

    // 2. Handle MCP Protocol Methods
    try {
      // Method: initialize
      if (method === "initialize") {
        const requested = String(payload?.params?.protocolVersion || "");
        const protocolVersion = SUPPORTED_PROTOCOL_VERSIONS.includes(requested)
          ? requested
          : "2025-03-26";
        return {
          jsonrpc: "2.0",
          id: id ?? 1,
          result: {
            protocolVersion,
            serverInfo: {
              name: "analytika",
              title: "Analytika Analytics",
              version: "1.0.0",
            },
            capabilities: {
              tools: {
                listChanged: false,
              },
            },
            instructions:
              "You are connected to Analytika. Use list_websites first, then query live visitors, overview metrics, traffic sources, revenue, pages, or social radar for a website.",
          },
        };
      }

      // Method: ping
      if (method === "ping") {
        return {
          jsonrpc: "2.0",
          id,
          result: {},
        };
      }

      // Method: tools/list
      if (method === "tools/list") {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            tools: MCP_TOOLS,
          },
        };
      }

      // Method: tools/call
      if (method === "tools/call") {
        const toolName = payload.params?.name;
        const args = payload.params?.arguments || {};

        // Tool: list_websites
        if (toolName === "list_websites") {
          const sites = await db
            .select({
              id: websites.id,
              domain: websites.domain,
              currency: websites.currency,
              revenueModel: websites.revenueModel,
              createdAt: websites.createdAt,
            })
            .from(websites)
            .where(eq(websites.userId, user.id));

          return {
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      user: user.email,
                      plan: user.plan,
                      totalWebsites: sites.length,
                      websites: sites,
                    },
                    null,
                    2
                  ),
                },
              ],
            },
          };
        }

        // Tool: get_realtime_visitors
        if (toolName === "get_realtime_visitors") {
          const site = await resolveWebsite(args.websiteId);
          if (!site) {
            return {
              jsonrpc: "2.0",
              id,
              result: {
                content: [{ type: "text", text: "No websites found in this Analytika account." }],
              },
            };
          }

          const liveQuery = `
            SELECT
              uniqExact(visitor_id) AS online_visitors,
              pathname AS path,
              count() AS pageviews
            FROM events
            WHERE website_id = {siteId: String}
              AND timestamp >= now() - INTERVAL 5 MINUTE
            GROUP BY pathname
            ORDER BY pageviews DESC
            LIMIT 10
          `;

          const res = await clickhouse.query({
            query: liveQuery,
            query_params: { siteId: site.id },
            format: "JSONEachRow",
          });
          const rows: any[] = await res.json();
          const totalOnline = rows.reduce((acc, r) => acc + Number(r.online_visitors || 0), 0);

          return {
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      websiteId: site.id,
                      domain: site.domain,
                      onlineNow: totalOnline,
                      window: "Last 5 minutes",
                      activePages: rows.map((r) => ({
                        path: r.path,
                        activePageviews: Number(r.pageviews || 0),
                      })),
                    },
                    null,
                    2
                  ),
                },
              ],
            },
          };
        }

        // Tool: get_overview_metrics
        if (toolName === "get_overview_metrics") {
          const site = await resolveWebsite(args.websiteId);
          if (!site) {
            return {
              jsonrpc: "2.0",
              id,
              result: {
                content: [{ type: "text", text: "No website found." }],
              },
            };
          }

          const timeRange = args.timeRange || "30 Days";
          const { from, to } = resolveTimeRangeDates(timeRange);

          const query = `
            SELECT
              uniqExact(visitor_id) AS visitors,
              count() AS pageviews,
              uniqExact(session_id) AS sessions,
              countIf(event_name = 'purchase') AS purchases,
              sum(event_value) AS revenue
            FROM events
            WHERE website_id = {siteId: String}
              AND timestamp >= {from: String}
              AND timestamp <= {to: String}
          `;

          const res = await clickhouse.query({
            query,
            query_params: { siteId: site.id, from, to },
            format: "JSONEachRow",
          });
          const rows: any[] = await res.json();
          const row = rows[0] || {};

          const visitors = Number(row.visitors || 0);
          const pageviews = Number(row.pageviews || 0);
          const sessions = Number(row.sessions || 0);
          const purchases = Number(row.purchases || 0);
          const revenue = Number(row.revenue || 0);
          const conversionRate = visitors > 0 ? (purchases / visitors) * 100 : 0;

          return {
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      websiteId: site.id,
                      domain: site.domain,
                      timeRange,
                      period: { from, to },
                      metrics: {
                        uniqueVisitors: visitors,
                        pageviews,
                        sessions,
                        purchases,
                        revenue: `$${revenue.toLocaleString()}`,
                        conversionRate: `${conversionRate.toFixed(2)}%`,
                      },
                    },
                    null,
                    2
                  ),
                },
              ],
            },
          };
        }

        // Tool: get_traffic_sources
        if (toolName === "get_traffic_sources") {
          const site = await resolveWebsite(args.websiteId);
          if (!site) {
            return {
              jsonrpc: "2.0",
              id,
              result: { content: [{ type: "text", text: "No website found." }] },
            };
          }

          const timeRange = args.timeRange || "30 Days";
          const parsed = parseInt(args.limit, 10);
          const limit = Number.isFinite(parsed) ? Math.min(parsed, 50) : 10;
          const { from, to } = resolveTimeRangeDates(timeRange);

          const query = `
            SELECT
              referrer,
              utm_source,
              utm_campaign,
              uniqExact(visitor_id) AS visitors,
              count() AS pageviews,
              countIf(event_name = 'purchase') AS conversions,
              sum(event_value) AS revenue
            FROM events
            WHERE website_id = {siteId: String}
              AND timestamp >= {from: String}
              AND timestamp <= {to: String}
            GROUP BY referrer, utm_source, utm_campaign
            ORDER BY visitors DESC
            LIMIT ${limit}
          `;

          const res = await clickhouse.query({
            query,
            query_params: { siteId: site.id, from, to },
            format: "JSONEachRow",
          });
          const rows: any[] = await res.json();

          return {
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      websiteId: site.id,
                      domain: site.domain,
                      timeRange,
                      sources: rows.map((r) => ({
                        referrer: r.referrer || "Direct",
                        source: r.utm_source || "None",
                        campaign: r.utm_campaign || "None",
                        visitors: Number(r.visitors || 0),
                        pageviews: Number(r.pageviews || 0),
                        conversions: Number(r.conversions || 0),
                        revenue: Number(r.revenue || 0),
                      })),
                    },
                    null,
                    2
                  ),
                },
              ],
            },
          };
        }

        // Tool: get_revenue_attribution
        if (toolName === "get_revenue_attribution") {
          const site = await resolveWebsite(args.websiteId);
          if (!site) {
            return {
              jsonrpc: "2.0",
              id,
              result: { content: [{ type: "text", text: "No website found." }] },
            };
          }

          const timeRange = args.timeRange || "30 Days";
          const { from, to } = resolveTimeRangeDates(timeRange);

          const query = `
            SELECT
              referrer,
              utm_source,
              utm_medium,
              utm_campaign,
              pathname AS entry_page,
              countIf(event_name = 'purchase') AS purchases,
              sum(event_value) AS total_revenue
            FROM events
            WHERE website_id = {siteId: String}
              AND timestamp >= {from: String}
              AND timestamp <= {to: String}
              AND event_value > 0
            GROUP BY referrer, utm_source, utm_medium, utm_campaign, pathname
            ORDER BY total_revenue DESC
            LIMIT 20
          `;

          const res = await clickhouse.query({
            query,
            query_params: { siteId: site.id, from, to },
            format: "JSONEachRow",
          });
          const rows: any[] = await res.json();

          return {
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      websiteId: site.id,
                      domain: site.domain,
                      timeRange,
                      attributedRevenueSources: rows.map((r) => ({
                        channel: r.utm_source || r.referrer || "Direct Traffic",
                        campaign: r.utm_campaign || "None",
                        landingPage: r.entry_page || "/",
                        purchases: Number(r.purchases || 0),
                        revenue: `$${Number(r.total_revenue || 0).toLocaleString()}`,
                      })),
                    },
                    null,
                    2
                  ),
                },
              ],
            },
          };
        }

        // Tool: get_social_radar
        if (toolName === "get_social_radar") {
          const site = await resolveWebsite(args.websiteId);
          if (!site) {
            return {
              jsonrpc: "2.0",
              id,
              result: { content: [{ type: "text", text: "No website found." }] },
            };
          }

          const timeRange = args.timeRange || "30 Days";
          const radarData = await getSocialRadarMetrics({
            websiteId: site.id,
            domain: site.domain,
            timeRange,
          });

          return {
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      websiteId: site.id,
                      domain: site.domain,
                      timeRange,
                      stats: radarData.stats,
                      recentMentions: radarData.mentions.slice(0, 15).map((m) => ({
                        platform: m.platform,
                        author: m.authorName,
                        handle: m.authorHandle,
                        content: m.content,
                        likes: m.likes,
                        url: m.url,
                        date: m.postedAt,
                      })),
                    },
                    null,
                    2
                  ),
                },
              ],
            },
          };
        }

        // Tool: get_top_pages
        if (toolName === "get_top_pages") {
          const site = await resolveWebsite(args.websiteId);
          if (!site) {
            return {
              jsonrpc: "2.0",
              id,
              result: { content: [{ type: "text", text: "No website found." }] },
            };
          }

          const timeRange = args.timeRange || "30 Days";
          const parsedLimit = parseInt(args.limit, 10);
          const limit = Number.isFinite(parsedLimit) ? Math.min(parsedLimit, 50) : 10;
          const { from, to } = resolveTimeRangeDates(timeRange);

          const query = `
            SELECT
              pathname AS path,
              count() AS pageviews,
              uniqExact(visitor_id) AS visitors
            FROM events
            WHERE website_id = {siteId: String}
              AND timestamp >= {from: String}
              AND timestamp <= {to: String}
            GROUP BY pathname
            ORDER BY pageviews DESC
            LIMIT ${limit}
          `;

          const res = await clickhouse.query({
            query,
            query_params: { siteId: site.id, from, to },
            format: "JSONEachRow",
          });
          const rows: any[] = await res.json();

          return {
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      websiteId: site.id,
                      domain: site.domain,
                      timeRange,
                      topPages: rows.map((r) => ({
                        path: r.path,
                        pageviews: Number(r.pageviews || 0),
                        uniqueVisitors: Number(r.visitors || 0),
                      })),
                    },
                    null,
                    2
                  ),
                },
              ],
            },
          };
        }

        // Unknown Tool
        return {
          jsonrpc: "2.0",
          id,
          error: {
            code: -32601,
            message: `Unknown tool: '${toolName}'. Use 'tools/list' to view available Analytika tools.`,
          },
        };
      }

      // Default / Unknown Method
      return {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32601,
          message: `Method '${method}' not found. Supported methods: initialize, tools/list, tools/call, ping.`,
        },
      };
    } catch (err: any) {
      logger.error("MCP Execution Error:", err);
      return {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32603,
          message: `Internal MCP error: ${err?.message || "Unknown error"}`,
        },
      };
    }
  });

export const mcpRoutes = new Elysia()
  .use(new Elysia({ prefix: "/api/v1/mcp" }).use(mcpHandler))
  .use(new Elysia({ prefix: "/mcp" }).use(mcpHandler));
