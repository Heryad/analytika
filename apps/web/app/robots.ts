import type { MetadataRoute } from "next";

/**
 * Next.js SEO Robots Configuration
 * Handles Web Crawlers, Googlebot, and AI Search Agents (GPTBot, ClaudeBot, PerplexityBot)
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/share/", "/a.js", "/script.js", "/llms.txt", "/llms-full.txt"],
        disallow: ["/dashboard/", "/api/", "/auth/callback", "/embed/"],
      },
      // AI Crawlers & LLM Search Engines
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "ClaudeBot",
          "anthropic-ai",
          "PerplexityBot",
          "Google-Extended",
          "Applebot",
          "CCBot",
          "cohere-ai",
          "Bytespider",
        ],
        allow: ["/", "/share/", "/llms.txt", "/llms-full.txt"],
        disallow: ["/dashboard/", "/api/"],
      },
    ],
    sitemap: "https://analytika.me/sitemap.xml",
    host: "https://analytika.me",
  };
}
