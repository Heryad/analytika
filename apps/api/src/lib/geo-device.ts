import { createHash } from "crypto";
import geoip from "geoip-lite";
import { env } from "@/config/env";

export interface ParsedUserAgent {
  browser: string;
  browser_version: string;
  os: string;
  device_type: "desktop" | "mobile" | "tablet";
}

export interface ParsedReferrer {
  referrer_domain: string;
  channel: "Direct" | "Organic Search" | "Social" | "Email" | "Referral" | "Paid";
}

export interface GeoLocation {
  country_code: string;
  city: string;
  region: string;
}

/**
 * Fast Regex User-Agent Parser
 */
export function parseUserAgent(ua: string = ""): ParsedUserAgent {
  if (!ua) {
    return {
      browser: "Unknown",
      browser_version: "",
      os: "Unknown",
      device_type: "desktop",
    };
  }

  const uaLower = ua.toLowerCase();

  // 1. Device Type
  let device_type: "desktop" | "mobile" | "tablet" = "desktop";
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
    device_type = "tablet";
  } else if (/mobile|iphone|ipod|android|blackberry|opera mini|windows phone/i.test(ua)) {
    device_type = "mobile";
  }

  // 2. Operating System (Check iOS before macOS because iOS user-agents include 'like Mac OS X')
  let os = "Unknown";
  if (/windows nt 10\.0/i.test(ua)) os = "Windows 10/11";
  else if (/windows nt 6\.3/i.test(ua)) os = "Windows 8.1";
  else if (/windows nt 6\.2/i.test(ua)) os = "Windows 8";
  else if (/windows nt 6\.1/i.test(ua)) os = "Windows 7";
  else if (/windows/i.test(ua)) os = "Windows";
  else if (/iphone|ipad|ipod|cpu (?:iphone )?os /i.test(ua)) os = "iOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
  else if (/cros/i.test(ua)) os = "Chrome OS";
  else if (/linux/i.test(ua)) os = "Linux";

  // 3. Browser Name & Version
  let browser = "Other";
  let browser_version = "";

  if (/arc\//i.test(ua)) {
    browser = "Arc";
    browser_version = ua.match(/arc\/([\d.]+)/i)?.[1] || "";
  } else if (/brave\//i.test(ua) || (typeof (navigator as any) !== "undefined" && (navigator as any).brave)) {
    browser = "Brave";
    browser_version = ua.match(/chrome\/([\d.]+)/i)?.[1] || "";
  } else if (/edg(?:e|a|ios)?\/([\d.]+)/i.test(ua)) {
    browser = "Edge";
    browser_version = ua.match(/edg(?:e|a|ios)?\/([\d.]+)/i)?.[1] || "";
  } else if (/opr\/([\d.]+)|opera/i.test(ua)) {
    browser = "Opera";
    browser_version = ua.match(/opr\/([\d.]+)/i)?.[1] || "";
  } else if (/chrome|crios/i.test(ua) && !/chromium|edg/i.test(ua)) {
    browser = "Chrome";
    browser_version = ua.match(/(?:chrome|crios)\/([\d.]+)/i)?.[1] || "";
  } else if (/firefox|fxios/i.test(ua)) {
    browser = "Firefox";
    browser_version = ua.match(/(?:firefox|fxios)\/([\d.]+)/i)?.[1] || "";
  } else if (/safari/i.test(ua) && !/chrome|crios|android/i.test(ua)) {
    browser = "Safari";
    browser_version = ua.match(/version\/([\d.]+)/i)?.[1] || "";
  } else if (/samsungbrowser/i.test(ua)) {
    browser = "Samsung Internet";
    browser_version = ua.match(/samsungbrowser\/([\d.]+)/i)?.[1] || "";
  }

  // Extract major version
  if (browser_version && browser_version.includes(".")) {
    browser_version = browser_version.split(".")[0];
  }

  return {
    browser,
    browser_version,
    os,
    device_type,
  };
}

/**
 * Parses referrer URL and classifies traffic acquisition channel
 */
export function parseReferrer(
  referrer: string = "",
  currentHostname: string = ""
): ParsedReferrer {
  if (!referrer) {
    return {
      referrer_domain: "",
      channel: "Direct",
    };
  }

  let domain = "";
  try {
    const url = new URL(referrer.startsWith("http") ? referrer : `https://${referrer}`);
    domain = url.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    domain = referrer.split("/")[0].replace(/^www\./, "").toLowerCase();
  }

  // Internal navigation is Direct
  if (currentHostname && (domain === currentHostname || domain.endsWith(`.${currentHostname}`))) {
    return {
      referrer_domain: "",
      channel: "Direct",
    };
  }

  // Search Engines
  const searchEngines = [
    "google.",
    "bing.com",
    "duckduckgo.com",
    "yahoo.",
    "yandex.",
    "baidu.com",
    "ecosia.org",
    "qwant.com",
    "startpage.com",
    "kagi.com",
  ];
  if (searchEngines.some((se) => domain.includes(se))) {
    return {
      referrer_domain: domain,
      channel: "Organic Search",
    };
  }

  // Social Media & Communities
  const socialDomains = [
    "t.co",
    "twitter.com",
    "x.com",
    "linkedin.com",
    "reddit.com",
    "news.ycombinator.com",
    "instagram.com",
    "facebook.com",
    "fb.com",
    "youtube.com",
    "youtu.be",
    "threads.net",
    "bsky.app",
    "tiktok.com",
    "pinterest.com",
    "producthunt.com",
    "discord.com",
    "telegram.org",
    "t.me",
    "github.com",
  ];
  if (socialDomains.some((sd) => domain === sd || domain.endsWith(`.${sd}`))) {
    return {
      referrer_domain: domain,
      channel: "Social",
    };
  }

  // Email clients
  const emailDomains = ["mail.google.com", "outlook.live.com", "mail.yahoo.com", "mail.proton.me"];
  if (emailDomains.some((ed) => domain === ed || domain.endsWith(`.${ed}`))) {
    return {
      referrer_domain: domain,
      channel: "Email",
    };
  }

  return {
    referrer_domain: domain,
    channel: "Referral",
  };
}

/**
 * Computes privacy-first, cookieless daily rolling visitor hash and session ID
 */
export function getVisitorAndSessionId(
  websiteId: string,
  ip: string = "127.0.0.1",
  userAgent: string = "",
  timestampUtc: string = new Date().toISOString()
): { visitor_id: string; session_id: string } {
  const dateDay = timestampUtc.slice(0, 10); // YYYY-MM-DD
  const dateHour = timestampUtc.slice(0, 13); // YYYY-MM-DDTHH

  const salt = env.JWT_SECRET;

  // Daily unique visitor hash (rotates daily, zero persistent cookies)
  const visitor_id = createHash("sha256")
    .update(`${salt}_${websiteId}_${dateDay}_${ip}_${userAgent}`)
    .digest("hex")
    .slice(0, 16);

  // Hourly session window hash
  const session_id = createHash("sha256")
    .update(`${salt}_${websiteId}_${dateHour}_${ip}_${userAgent}`)
    .digest("hex")
    .slice(0, 16);

  return { visitor_id, session_id };
}

function safeDecode(val: string): string {
  try {
    return decodeURIComponent(val);
  } catch {
    return val;
  }
}

/**
 * Resolves Geolocation from Cloudflare / Edge Headers or local MaxMind database
 */
export function getGeoLocation(
  headers: Record<string, string | undefined>,
  ip?: string
): GeoLocation {
  let country =
    headers["cf-ipcountry"] ||
    headers["x-country"] ||
    headers["x-vercel-ip-country"] ||
    headers["geoip-country-code"] ||
    "";

  let city =
    headers["cf-ipcity"] ||
    headers["x-city"] ||
    headers["x-vercel-ip-city"] ||
    "";

  let region =
    headers["cf-region"] ||
    headers["x-region"] ||
    headers["x-vercel-ip-country-region"] ||
    "";

  // If no reverse-proxy edge geo headers are available, use local MaxMind GeoIP database lookup
  if ((!country || country === "XX") && ip && ip !== "127.0.0.1" && ip !== "::1") {
    try {
      const cleanIp = ip.replace(/^::ffff:/, "").trim();
      const geo = geoip.lookup(cleanIp);
      if (geo) {
        country = geo.country || "XX";
        city = geo.city || "";
        region = geo.region || "";
      }
    } catch {
      // ignore lookup failure
    }
  }

  return {
    country_code: (country || "XX").toUpperCase().slice(0, 2),
    city: safeDecode(city),
    region: safeDecode(region),
  };
}

/**
 * Extracts Client IP Address safely
 */
export function getClientIp(
  headers: Record<string, string | undefined>,
  fallbackIp: string = "127.0.0.1"
): string {
  const forwarded = headers["x-forwarded-for"];
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }

  return (
    headers["cf-connecting-ip"] ||
    headers["x-real-ip"] ||
    headers["true-client-ip"] ||
    fallbackIp
  );
}
