import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { websites, alerts, users } from "@/db/schema";
import { clickhouse, ClickHouseEventRecord } from "@/db/clickhouse";
import {
  parseUserAgent,
  parseReferrer,
  getVisitorAndSessionId,
  getGeoLocation,
  getClientIp,
} from "@/lib/geo-device";
import { logger } from "@/lib/logger";
import { env } from "@/config/env";
import { sendAlertEmail } from "@/services/resend";

export interface RawIncomingEvent {
  website_id: string;
  event_name?: string;
  event_value?: number | null;
  event_currency?: string | null;
  hostname?: string;
  pathname?: string;
  search?: string;
  hash?: string;
  referrer?: string;
  screen_width?: number;
  screen_height?: number;
  user_language?: string;
  page_title?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  props?: Record<string, any>;
  properties?: Record<string, any>;
}

interface CachedWebsite {
  exists: boolean;
  domain: string;
  userId: string;
  customProxyDomain: string | null;
  allowLocalhost: boolean;
  blockedIps: string[];
  excludedPaths: string[];
  cachedAt: number;
}

// 5-minute in-memory LRU website cache
const websiteCache = new Map<string, CachedWebsite>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export function invalidateWebsiteCache(websiteId: string): void {
  websiteCache.delete(websiteId);
  alertCache.delete(websiteId);
}

function isIpBlocked(clientIp: string, blockedIps: string[]): boolean {
  if (!blockedIps || blockedIps.length === 0 || !clientIp) return false;
  return blockedIps.some((pattern) => {
    const cleanPattern = pattern.trim();
    if (!cleanPattern) return false;
    if (cleanPattern === clientIp) return true;
    if (cleanPattern.includes("/")) {
      const [subnet, bitsStr] = cleanPattern.split("/");
      const bits = parseInt(bitsStr, 10);
      if (bits === 24) {
        return subnet.split(".").slice(0, 3).join(".") === clientIp.split(".").slice(0, 3).join(".");
      }
      if (bits === 16) {
        return subnet.split(".").slice(0, 2).join(".") === clientIp.split(".").slice(0, 2).join(".");
      }
      if (bits === 8) {
        return subnet.split(".")[0] === clientIp.split(".")[0];
      }
    }
    return false;
  });
}

/**
 * Validates website ID against cache and PostgreSQL
 */
async function getCachedWebsite(websiteId: string): Promise<CachedWebsite | null> {
  const now = Date.now();
  const cached = websiteCache.get(websiteId);

  if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
    return cached.exists ? cached : null;
  }

  try {
    const site = await db.query.websites.findFirst({
      where: eq(websites.id, websiteId),
      columns: {
        id: true,
        domain: true,
        userId: true,
        customProxyDomain: true,
        allowLocalhost: true,
        blockedIps: true,
        excludedPaths: true,
      },
    });

    if (site) {
      const entry: CachedWebsite = {
        exists: true,
        domain: site.domain.toLowerCase().trim(),
        userId: site.userId,
        customProxyDomain: site.customProxyDomain?.toLowerCase().trim() || null,
        allowLocalhost: site.allowLocalhost ?? true,
        blockedIps: (site.blockedIps || []).map((ip: string) => ip.trim()),
        excludedPaths: site.excludedPaths || [],
        cachedAt: now,
      };
      websiteCache.set(websiteId, entry);
      return entry;
    } else {
      websiteCache.set(websiteId, {
        exists: false,
        domain: "",
        userId: "",
        customProxyDomain: null,
        allowLocalhost: false,
        blockedIps: [],
        excludedPaths: [],
        cachedAt: now,
      });
      return null;
    }
  } catch (err) {
    logger.error("Error validating website in DB", { websiteId, error: err });
    return null;
  }
}

interface CachedAlert {
  id: string;
  websiteId: string;
  name: string;
  eventId: string;
  subjectTemplate: string;
  bodyTemplate: string;
  userEmail: string;
  lastTriggeredAt: number;
}

const alertCache = new Map<string, { alerts: CachedAlert[]; cachedAt: number }>();
const ALERT_CACHE_TTL_MS = 2 * 60 * 1000;
const ALERT_COOLDOWN_MS = 60 * 1000; // 1 min cooldown per alert rule

async function getCachedAlertsForSite(websiteId: string, userId: string): Promise<CachedAlert[]> {
  const now = Date.now();
  const cached = alertCache.get(websiteId);
  if (cached && now - cached.cachedAt < ALERT_CACHE_TTL_MS) {
    return cached.alerts;
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { email: true },
    });
    if (!user || !user.email) return [];

    const dbAlerts = await db
      .select()
      .from(alerts)
      .where(and(eq(alerts.websiteId, websiteId), eq(alerts.enabled, true)));

    const activeList: CachedAlert[] = dbAlerts.map((a) => ({
      id: a.id,
      websiteId: a.websiteId,
      name: a.name,
      eventId: a.eventId,
      subjectTemplate: a.subjectTemplate,
      bodyTemplate: a.bodyTemplate,
      userEmail: user.email,
      lastTriggeredAt: a.lastTriggeredAt ? new Date(a.lastTriggeredAt).getTime() : 0,
    }));

    alertCache.set(websiteId, { alerts: activeList, cachedAt: now });
    return activeList;
  } catch (err) {
    logger.error("Error fetching site alerts for evaluation:", err);
    return [];
  }
}

function interpolateTemplate(
  template: string,
  alertName: string,
  record: ClickHouseEventRecord
): string {
  const props = record.properties || {};
  const visitorName = props.name || props.visitor_name || props.user_name || "Anonymous";
  const visitorEmail = props.email || props.visitor_email || props.user_email || "";

  return template
    .replace(/\{\{alert_name\}\}/g, alertName)
    .replace(/\{\{event_id\}\}/g, record.event_name)
    .replace(/\{\{event\.name\}\}/g, record.event_name)
    .replace(/\{\{event\.timestamp\}\}/g, record.timestamp + " UTC")
    .replace(/\{\{visitor\.name\}\}/g, visitorName)
    .replace(/\{\{visitor\.email\}\}/g, visitorEmail)
    .replace(/\{\{visitor\.country\}\}/g, record.country_code || "Unknown")
    .replace(/\{\{location\.country\}\}/g, record.country_code || "Unknown")
    .replace(/\{\{location\.region\}\}/g, record.region || "Unknown")
    .replace(/\{\{location\.city\}\}/g, record.city || "Unknown")
    .replace(/\{\{source\.referrer\}\}/g, record.referrer || "Direct")
    .replace(/\{\{source\.ref\}\}/g, record.referrer_domain || "Direct")
    .replace(/\{\{source\.source\}\}/g, record.channel || "Direct")
    .replace(/\{\{source\.utm_source\}\}/g, record.utm_source || "None")
    .replace(/\{\{source\.utm_medium\}\}/g, record.utm_medium || "None")
    .replace(/\{\{source\.utm_campaign\}\}/g, record.utm_campaign || "None")
    .replace(/\{\{source\.utm_term\}\}/g, record.utm_term || "None")
    .replace(/\{\{source\.utm_content\}\}/g, record.utm_content || "None")
    .replace(/\{\{system\.device\}\}/g, record.device_type || "Desktop")
    .replace(/\{\{system\.os\}\}/g, record.os || "Unknown")
    .replace(/\{\{system\.browser\}\}/g, `${record.browser} ${record.browser_version}`.trim());
}

async function triggerAlertsForEvent(
  site: CachedWebsite,
  record: ClickHouseEventRecord
) {
  if (record.event_name === "pageview") return;

  try {
    const siteAlerts = await getCachedAlertsForSite(record.website_id, site.userId);
    if (!siteAlerts.length) return;

    const matching = siteAlerts.filter(
      (a) => a.eventId.toLowerCase() === record.event_name.toLowerCase()
    );

    const now = Date.now();

    for (const alert of matching) {
      if (now - alert.lastTriggeredAt < ALERT_COOLDOWN_MS) {
        continue;
      }

      alert.lastTriggeredAt = now;

      const subject = interpolateTemplate(alert.subjectTemplate, alert.name, record);
      const customBody = interpolateTemplate(alert.bodyTemplate, alert.name, record);
      const props = record.properties || {};

      sendAlertEmail(alert.userEmail, {
        alertName: alert.name,
        eventName: record.event_name,
        websiteDomain: site.domain,
        subject,
        customBody,
        metadata: {
          visitorName: props.name || props.visitor_name,
          visitorEmail: props.email || props.visitor_email,
          location: [record.city, record.region, record.country_code].filter(Boolean).join(", ") || "Global",
          source: [record.utm_source, record.utm_campaign].filter(Boolean).join(" / ") || record.referrer_domain || "Direct",
          device: `${record.browser} on ${record.os}`,
          revenue: record.event_value ? `${record.event_currency || "$"}${record.event_value}` : undefined,
          timestamp: record.timestamp + " UTC",
        },
        dashboardUrl: `https://analytika.me/dashboard/${record.website_id}`,
      }).catch((err) => {
        logger.error(`Failed to dispatch alert email "${alert.name}":`, err);
      });

      db.update(alerts)
        .set({ lastTriggeredAt: new Date() })
        .where(eq(alerts.id, alert.id))
        .catch((err) => logger.error("Failed to update alert lastTriggeredAt:", err));
    }
  } catch (err) {
    logger.error("Error in triggerAlertsForEvent:", err);
  }
}

/**
 * Verifies if incoming hostname is authorized for this website
 */
function isHostnameAuthorized(
  incomingHost: string = "",
  registeredDomain: string,
  customProxyDomain: string | null = null,
  allowLocalhost: boolean = true
): boolean {
  if (!incomingHost) return true; // fallback to registered domain

  const cleanIncoming = incomingHost
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .split(":")[0]
    .toLowerCase()
    .trim();

  // 1. Exact domain match or subdomains (e.g. app.agentspilot.me matches agentspilot.me)
  if (
    cleanIncoming === registeredDomain ||
    cleanIncoming.endsWith(`.${registeredDomain}`)
  ) {
    return true;
  }

  // 2. Custom Proxy Subdomain (CNAME) match
  if (
    customProxyDomain &&
    (cleanIncoming === customProxyDomain || cleanIncoming.endsWith(`.${customProxyDomain}`))
  ) {
    return true;
  }

  // 3. Localhost & Dev Environments
  if (allowLocalhost || env.NODE_ENV === "development") {
    if (
      cleanIncoming === "localhost" ||
      cleanIncoming === "127.0.0.1" ||
      cleanIncoming === "::1" ||
      cleanIncoming.endsWith(".local") ||
      cleanIncoming.endsWith(".localhost") ||
      cleanIncoming.endsWith(".test")
    ) {
      return true;
    }
  }

  return false;
}

/**
 * In-Memory Event Ingestion Micro-Batch Queue
 */
class IngestionBatchWorker {
  private queue: ClickHouseEventRecord[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private isFlushing = false;
  private maxBatchSize = 250;
  private flushIntervalMs = 500;

  constructor() {
    this.flushTimer = setInterval(() => this.flush(), this.flushIntervalMs);
  }

  public push(event: ClickHouseEventRecord): void {
    this.queue.push(event);
    if (this.queue.length >= this.maxBatchSize) {
      this.flush();
    }
  }

  public async flush(): Promise<void> {
    if (this.isFlushing || this.queue.length === 0) return;

    this.isFlushing = true;
    const batch = this.queue.splice(0, this.maxBatchSize);

    try {
      await clickhouse.insert({
        table: "events",
        values: batch,
        format: "JSONEachRow",
      });

      logger.info("Flushed ClickHouse event batch", { count: batch.length });
    } catch (err: any) {
      logger.error("ClickHouse batch insert failed", {
        count: batch.length,
        error: err?.message || err,
      });
      // Re-queue items once if transient error
      if (batch.length <= 100) {
        this.queue.unshift(...batch);
      }
    } finally {
      this.isFlushing = false;
    }
  }

  public stop(): void {
    if (this.flushTimer) clearInterval(this.flushTimer);
  }
}

export const ingestionWorker = new IngestionBatchWorker();

/**
 * Ingests a raw event payload, verifies domain authorization, enriches telemetry, and enqueues to ClickHouse
 */
export async function ingestEvent(
  raw: RawIncomingEvent,
  headers: Record<string, string | undefined>,
  remoteIp: string = "127.0.0.1"
): Promise<{ success: boolean; error?: string }> {
  const websiteId = raw.website_id?.trim();
  if (!websiteId) {
    return { success: false, error: "website_id is required" };
  }

  // 1. Validate website existence & settings
  const site = await getCachedWebsite(websiteId);
  if (!site) {
    return { success: false, error: "Website not found or inactive" };
  }

  // 2. Strict Domain & Hostname Verification
  const incomingHost = raw.hostname || headers["origin"] || headers["host"] || "";
  const isAuthorized = isHostnameAuthorized(
    incomingHost,
    site.domain,
    site.customProxyDomain,
    site.allowLocalhost
  );

  if (!isAuthorized) {
    logger.warn("Ingestion rejected: unauthorized hostname", {
      websiteId,
      registeredDomain: site.domain,
      incomingHost,
    });
    return {
      success: false,
      error: `Hostname '${incomingHost}' is not authorized for website '${site.domain}'`,
    };
  }

  // 3. Check Exclude Own Visits Cookie
  const cookieHeader = headers["cookie"] || "";
  if (cookieHeader.includes("analytika_ignore=true")) {
    return { success: true };
  }

  // 4. Resolve client IP and Blocklist
  const clientIp = getClientIp(headers, remoteIp);
  if (isIpBlocked(clientIp, site.blockedIps)) {
    return { success: true }; // drop silently for blocked IPs
  }

  // 4. Path Exclusions
  const pathname = (raw.pathname || "/").slice(0, 512);
  if (site.excludedPaths.length > 0) {
    const isExcluded = site.excludedPaths.some((pattern) => {
      if (pattern.endsWith("*")) {
        return pathname.startsWith(pattern.slice(0, -1));
      }
      return pathname === pattern;
    });
    if (isExcluded) return { success: true };
  }

  // 5. Resolve Geolocation & User Agent
  const geo = getGeoLocation(headers, clientIp);
  const userAgent = headers["user-agent"] || "";
  const uaInfo = parseUserAgent(userAgent);

  // 6. Resolve Referrer & Traffic Channel
  let referrer = raw.referrer?.trim() || "";

  // If referrer is empty (e.g. user typed/pasted URL or opened from external apps), check URL query parameters (?ref=, ?source=, ?via=, ?referrer=)
  if (!referrer && raw.search) {
    try {
      const searchParams = new URLSearchParams(
        raw.search.startsWith("?") ? raw.search : `?${raw.search}`
      );
      const refQuery =
        searchParams.get("ref") ||
        searchParams.get("source") ||
        searchParams.get("referrer") ||
        searchParams.get("via");
      if (refQuery) {
        referrer = refQuery.startsWith("http") ? refQuery : `https://${refQuery}`;
      }
    } catch {}
  }

  // Fallback to HTTP Referer header if not internal navigation
  if (!referrer && headers["referer"]) {
    const reqReferer = headers["referer"].trim();
    try {
      const refUrl = new URL(reqReferer);
      const siteHost = (raw.hostname || site.domain).toLowerCase();
      if (
        refUrl.hostname.toLowerCase() !== siteHost &&
        !refUrl.hostname.toLowerCase().endsWith(`.${siteHost}`)
      ) {
        referrer = reqReferer;
      }
    } catch {}
  }

  const refInfo = parseReferrer(referrer, raw.hostname || site.domain);

  // 7. Generate Privacy Rolling Visitor & Session ID
  const nowUtc = new Date().toISOString();
  const { visitor_id, session_id } = getVisitorAndSessionId(
    websiteId,
    clientIp,
    userAgent,
    nowUtc
  );

  // 8. Normalize custom properties to string dictionary
  const rawProps = raw.props || raw.properties || {};
  const properties: Record<string, string> = {};
  for (const [key, val] of Object.entries(rawProps)) {
    if (val === undefined || val === null) continue;
    properties[key.slice(0, 64)] = typeof val === "object" ? JSON.stringify(val) : String(val).slice(0, 500);
  }

  // 9. Assemble ClickHouse record
  const record: ClickHouseEventRecord = {
    website_id: websiteId,
    event_name: (raw.event_name || "pageview").trim().slice(0, 64),
    event_value: typeof raw.event_value === "number" ? raw.event_value : null,
    event_currency: raw.event_currency ? raw.event_currency.toUpperCase().slice(0, 5) : null,
    timestamp: nowUtc.replace("T", " ").replace("Z", ""),
    session_id,
    visitor_id,
    hostname: (raw.hostname || site.domain).slice(0, 128),
    pathname,
    search: (raw.search || "").slice(0, 1024),
    hash: (raw.hash || "").slice(0, 256),
    referrer: referrer.slice(0, 1024),
    referrer_domain: refInfo.referrer_domain.slice(0, 128),
    channel: refInfo.channel,
    country_code: geo.country_code,
    city: geo.city.slice(0, 128),
    region: geo.region.slice(0, 128),
    browser: uaInfo.browser,
    browser_version: uaInfo.browser_version,
    os: uaInfo.os,
    device_type: uaInfo.device_type,
    screen_width: Number(raw.screen_width) || 0,
    screen_height: Number(raw.screen_height) || 0,
    user_language: (raw.user_language || headers["accept-language"] || "en").slice(0, 10),
    page_title: (raw.page_title || "").slice(0, 256),
    utm_source: (raw.utm_source || "").slice(0, 64),
    utm_medium: (raw.utm_medium || "").slice(0, 64),
    utm_campaign: (raw.utm_campaign || "").slice(0, 64),
    utm_term: (raw.utm_term || "").slice(0, 128),
    utm_content: (raw.utm_content || "").slice(0, 128),
    properties,
  };

  // 10. Queue for insertion
  ingestionWorker.push(record);

  // 11. Asynchronously evaluate alert triggers (non-blocking)
  if (record.event_name !== "pageview") {
    queueMicrotask(() => {
      triggerAlertsForEvent(site, record);
    });
  }

  return { success: true };
}
