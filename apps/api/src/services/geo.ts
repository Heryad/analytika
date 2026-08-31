export interface GeoLocation {
  country: string | null;
  region: string | null;
  city: string | null;
}

export function extractGeoLocation(headers: Record<string, string | undefined>): GeoLocation {
  // Cloudflare headers
  const country =
    headers["cf-ipcountry"] ||
    headers["x-vercel-ip-country"] ||
    headers["x-country-code"] ||
    headers["x-geoip-country"] ||
    null;

  const region =
    headers["cf-region"] ||
    headers["x-vercel-ip-country-region"] ||
    headers["x-region-code"] ||
    null;

  const city =
    headers["cf-ipcity"] ||
    headers["x-vercel-ip-city"] ||
    headers["x-city"] ||
    null;

  return {
    country: country ? country.toUpperCase() : null,
    region,
    city: city ? decodeURIComponent(city) : null,
  };
}

export function extractReferrerDomain(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  try {
    const url = new URL(referrer.startsWith("http") ? referrer : `https://${referrer}`);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function classifyChannel(
  referrerDomain: string | null | undefined,
  utmSource: string | null | undefined,
  utmMedium: string | null | undefined
): string {
  const medium = (utmMedium || "").toLowerCase();
  const source = (utmSource || "").toLowerCase();
  const ref = (referrerDomain || "").toLowerCase();

  // 1. Paid Traffic
  if (
    ["cpc", "ppc", "paid", "paidsocial", "display", "adwords", "ads"].includes(medium) ||
    source.includes("adwords") ||
    source.includes("meta_ads")
  ) {
    return "paid";
  }

  // 2. Email Marketing
  if (medium === "email" || medium === "newsletter" || source.includes("email") || source.includes("mail")) {
    return "email";
  }

  // 3. Social Media
  const socialDomains = [
    "x.com",
    "twitter.com",
    "t.co",
    "linkedin.com",
    "lnkd.in",
    "facebook.com",
    "fb.me",
    "instagram.com",
    "reddit.com",
    "youtube.com",
    "youtu.be",
    "tiktok.com",
    "pinterest.com",
    "threads.net",
    "news.ycombinator.com",
    "github.com",
    "producthunt.com",
    "discord.com",
    "telegram.me",
    "t.me",
  ];
  if (socialDomains.some((d) => ref.includes(d)) || ["social", "social-network", "sm"].includes(medium)) {
    return "social";
  }

  // 4. Organic Search
  const searchDomains = [
    "google.com",
    "bing.com",
    "duckduckgo.com",
    "yahoo.com",
    "baidu.com",
    "yandex.com",
    "ecosia.org",
    "brave.com",
    "search.yahoo.com",
  ];
  if (searchDomains.some((d) => ref.includes(d)) || medium === "organic") {
    return "organic_search";
  }

  // 5. Referral vs Direct
  if (ref) {
    return "referral";
  }

  return "direct";
}
