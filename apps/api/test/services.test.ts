import { describe, expect, it } from "bun:test";
import { parseUserAgent } from "../src/services/user-agent";
import { extractReferrerDomain, classifyChannel, extractGeoLocation } from "../src/services/geo";
import { PLAN_LIMITS } from "../src/services/polar";

describe("Analytika Backend Services", () => {
  describe("User Agent Parser", () => {
    it("should correctly identify Chrome on macOS Desktop", () => {
      const ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
      const result = parseUserAgent(ua);
      expect(result.browser).toBe("Chrome");
      expect(result.os).toBe("macOS");
      expect(result.deviceType).toBe("desktop");
    });

    it("should correctly identify Mobile Safari on iPhone", () => {
      const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1";
      const result = parseUserAgent(ua);
      expect(result.browser).toBe("Safari");
      expect(result.os).toBe("iOS");
      expect(result.deviceType).toBe("mobile");
    });

    it("should correctly identify iPad tablet", () => {
      const ua = "Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1";
      const result = parseUserAgent(ua);
      expect(result.deviceType).toBe("tablet");
      expect(result.os).toBe("iOS");
    });

    it("should handle null or empty user agent", () => {
      const result = parseUserAgent(null);
      expect(result.browser).toBe("Unknown");
      expect(result.os).toBe("Unknown");
      expect(result.deviceType).toBe("desktop");
    });
  });

  describe("Geolocation & Channel Classifier", () => {
    it("should extract referrer domain correctly", () => {
      expect(extractReferrerDomain("https://www.google.com/search?q=analytika")).toBe("google.com");
      expect(extractReferrerDomain("https://news.ycombinator.com/item?id=123")).toBe("news.ycombinator.com");
      expect(extractReferrerDomain(null)).toBeNull();
    });

    it("should classify organic search traffic", () => {
      expect(classifyChannel("google.com", null, null)).toBe("organic_search");
      expect(classifyChannel("duckduckgo.com", null, null)).toBe("organic_search");
    });

    it("should classify social media traffic", () => {
      expect(classifyChannel("x.com", null, null)).toBe("social");
      expect(classifyChannel("twitter.com", null, null)).toBe("social");
      expect(classifyChannel("github.com", null, null)).toBe("social");
    });

    it("should classify paid ad traffic", () => {
      expect(classifyChannel("google.com", "google_ads", "cpc")).toBe("paid");
      expect(classifyChannel(null, "facebook", "paid")).toBe("paid");
    });

    it("should classify email traffic", () => {
      expect(classifyChannel(null, "newsletter", "email")).toBe("email");
    });

    it("should classify direct traffic when no referrer exists", () => {
      expect(classifyChannel(null, null, null)).toBe("direct");
    });

    it("should extract Cloudflare and proxy geo headers", () => {
      const headers = {
        "cf-ipcountry": "us",
        "cf-region": "California",
        "cf-ipcity": "San%20Francisco",
      };
      const geo = extractGeoLocation(headers);
      expect(geo.country).toBe("US");
      expect(geo.region).toBe("California");
      expect(geo.city).toBe("San Francisco");
    });
  });

  describe("Polar.sh Plan Limits", () => {
    it("should have correct limits defined for each tier", () => {
      expect(PLAN_LIMITS.free.monthlyEventLimit).toBe(10_000);
      expect(PLAN_LIMITS.free.websiteLimit).toBe(1);

      expect(PLAN_LIMITS.pro.monthlyEventLimit).toBe(250_000);
      expect(PLAN_LIMITS.pro.websiteLimit).toBe(10);

      expect(PLAN_LIMITS.business.monthlyEventLimit).toBe(1_500_000);
      expect(PLAN_LIMITS.business.websiteLimit).toBe(999);
    });
  });
});
