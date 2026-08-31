import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { nanoid } from "nanoid";
import { insertEvents, type AnalyticsEventRow } from "../db/clickhouse";
import { validateApiKey, incrementMonthlyUsage } from "../services/quota";
import { parseUserAgent } from "../services/user-agent";
import { extractGeoLocation, extractReferrerDomain, classifyChannel } from "../services/geo";

export const ingestRoutes = new Elysia({ prefix: "/v1" })
  .use(
    cors({
      origin: true, // Allow all origins for cross-domain SDK tracking
      methods: ["POST", "OPTIONS", "GET"],
      allowedHeaders: ["Content-Type", "x-api-key", "Authorization"],
      credentials: false,
    })
  )

  // 1. Batch Ingestion Endpoint (used by Client SDK)
  .post(
    "/batch",
    async ({ body, headers, set }) => {
      const apiKey = body.apiKey;
      const origin = headers["origin"] || headers["referer"];

      // 1. Fast API Key Verification (in-memory cached)
      const validation = await validateApiKey(apiKey, origin);
      if (!validation.valid || !validation.websiteId || !validation.userId) {
        set.status = 403;
        return { success: false, error: validation.error || "Invalid API key" };
      }

      const websiteId = validation.websiteId;
      const userId = validation.userId;
      const geo = extractGeoLocation(headers);
      const userAgentHeader = headers["user-agent"] || "";

      let pageviewCount = 0;
      let customEventCount = 0;

      // 2. Prepare ClickHouse Rows
      const rows: AnalyticsEventRow[] = body.batch.map((evt) => {
        const ua = evt.context?.userAgent || userAgentHeader;
        const parsedUa = parseUserAgent(ua);

        const rawUrl = evt.context?.url || "https://unknown.com/";
        let hostname = "unknown";
        let path = "/";
        try {
          const parsedUrl = new URL(rawUrl);
          hostname = parsedUrl.hostname;
          path = parsedUrl.pathname;
        } catch {
          // ignore url parse error
        }

        const referrer = evt.context?.referrer || null;
        const referrerDomain = extractReferrerDomain(referrer);
        const utmSource = evt.context?.utm?.source || null;
        const utmMedium = evt.context?.utm?.medium || null;
        const utmCampaign = evt.context?.utm?.campaign || null;
        const utmTerm = evt.context?.utm?.term || null;
        const utmContent = evt.context?.utm?.content || null;

        const channel = classifyChannel(referrerDomain, utmSource, utmMedium);

        if (evt.type === "pageview") {
          pageviewCount++;
        } else {
          customEventCount++;
        }

        const props = (evt.properties || {}) as Record<string, any>;
        const userTraits = (evt.userTraits || {}) as Record<string, any>;

        return {
          id: evt.eventId || crypto.randomUUID(),
          website_id: websiteId,
          event_type: evt.type,
          event_name: evt.name,
          anonymous_id: evt.anonymousId,
          user_id: evt.userId || null,
          session_id: evt.sessionId,
          timestamp: evt.timestamp || new Date().toISOString(),

          hostname,
          url: rawUrl,
          path: evt.context?.path || path,
          entry_page: evt.context?.entryPage || null,
          referrer,
          referrer_domain: referrerDomain,
          channel,
          page_title: evt.context?.pageTitle || null,

          screen_resolution: evt.context?.screen || null,
          user_agent: ua,
          browser: parsedUa.browser,
          os: parsedUa.os,
          device_type: parsedUa.deviceType,

          country: geo.country,
          region: geo.region,
          city: geo.city,

          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          utm_term: utmTerm,
          utm_content: utmContent,

          revenue: typeof props.revenue === "number" ? props.revenue : (typeof props.value === "number" ? props.value : null),
          currency: typeof props.currency === "string" ? props.currency : "USD",

          properties: JSON.stringify(props),
          user_traits: JSON.stringify(userTraits),
          created_at: new Date().toISOString(),
        };
      });

      // 3. Bulk Insert into ClickHouse & Update Postgres Usage Counter (Asynchronously)
      try {
        await insertEvents(rows);
      } catch (chErr) {
        console.error("❌ Failed to insert into ClickHouse:", chErr);
      }

      // Increment Postgres monthly usage in background
      incrementMonthlyUsage(userId, websiteId, pageviewCount, customEventCount).catch((err) => {
        console.error("❌ Usage increment error:", err);
      });

      set.status = 202; // Accepted
      return { success: true, processed: rows.length };
    },
    {
      body: t.Object({
        apiKey: t.String(),
        sentAt: t.String(),
        batch: t.Array(
          t.Object({
            eventId: t.Optional(t.String()),
            type: t.Union([t.Literal("pageview"), t.Literal("track"), t.Literal("identify")]),
            name: t.String(),
            timestamp: t.String(),
            anonymousId: t.String(),
            userId: t.Optional(t.String()),
            sessionId: t.String(),
            context: t.Optional(
              t.Object({
                url: t.Optional(t.String()),
                path: t.Optional(t.String()),
                entryPage: t.Optional(t.String()),
                referrer: t.Optional(t.String()),
                pageTitle: t.Optional(t.String()),
                screen: t.Optional(t.String()),
                userAgent: t.Optional(t.String()),
                utm: t.Optional(
                  t.Object({
                    source: t.Optional(t.String()),
                    medium: t.Optional(t.String()),
                    campaign: t.Optional(t.String()),
                    term: t.Optional(t.String()),
                    content: t.Optional(t.String()),
                  })
                ),
              })
            ),
            properties: t.Optional(t.Record(t.String(), t.Any())),
            userTraits: t.Optional(t.Record(t.String(), t.Any())),
          })
        ),
      }),
    }
  )

  // 2. Single Event Server-to-Server Tracking Endpoint
  .post(
    "/track",
    async ({ body, headers, set }) => {
      const apiKey = headers["x-api-key"] || body.apiKey;
      if (!apiKey) {
        set.status = 401;
        return { success: false, error: "Missing x-api-key header or apiKey in body" };
      }

      const validation = await validateApiKey(apiKey);
      if (!validation.valid || !validation.websiteId || !validation.userId) {
        set.status = 403;
        return { success: false, error: validation.error || "Invalid API key" };
      }

      const websiteId = validation.websiteId;
      const userId = validation.userId;
      const geo = extractGeoLocation(headers);
      const userAgentHeader = headers["user-agent"] || "";
      const parsedUa = parseUserAgent(userAgentHeader);

      const isPageview = body.eventName === "pageview";
      const props = (body.properties || {}) as Record<string, any>;
      const userTraits = (body.userTraits || {}) as Record<string, any>;

      const row: AnalyticsEventRow = {
        id: crypto.randomUUID(),
        website_id: websiteId,
        event_type: isPageview ? "pageview" : "track",
        event_name: body.eventName,
        anonymous_id: body.anonymousId || `srv_${nanoid(16)}`,
        user_id: body.userId || null,
        session_id: body.sessionId || `srv_sess_${nanoid(16)}`,
        timestamp: body.timestamp || new Date().toISOString(),

        hostname: body.hostname || "server",
        url: body.url || "https://api.server",
        path: body.path || `/${body.eventName}`,
        channel: "direct",

        user_agent: userAgentHeader,
        browser: parsedUa.browser,
        os: parsedUa.os,
        device_type: parsedUa.deviceType,

        country: geo.country,
        region: geo.region,
        city: geo.city,

        revenue: typeof props.revenue === "number" ? props.revenue : (typeof props.value === "number" ? props.value : null),
        currency: typeof props.currency === "string" ? props.currency : "USD",

        properties: JSON.stringify(props),
        user_traits: JSON.stringify(userTraits),
        created_at: new Date().toISOString(),
      };

      try {
        await insertEvents([row]);
      } catch (chErr) {
        console.error("❌ Failed to insert into ClickHouse:", chErr);
      }

      incrementMonthlyUsage(userId, websiteId, isPageview ? 1 : 0, isPageview ? 0 : 1).catch(() => {});

      set.status = 200;
      return { success: true, eventId: row.id };
    },
    {
      body: t.Object({
        apiKey: t.Optional(t.String()),
        eventName: t.String(),
        anonymousId: t.Optional(t.String()),
        userId: t.Optional(t.String()),
        sessionId: t.Optional(t.String()),
        timestamp: t.Optional(t.String()),
        url: t.Optional(t.String()),
        path: t.Optional(t.String()),
        hostname: t.Optional(t.String()),
        properties: t.Optional(t.Record(t.String(), t.Any())),
        userTraits: t.Optional(t.Record(t.String(), t.Any())),
      }),
    }
  );
