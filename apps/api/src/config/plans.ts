/**
 * Central Dynamic Plans & Pricing Definition Engine
 * Single Source of Truth for Limits, Feature Gating, Volume Tiers & Polar Products
 */

export interface PricingTier {
  events: number;
  label: string;
  soloMonthly: number;
  soloAnnual: number;
  growthMonthly: number;
  growthAnnual: number;
  polarProductIdSoloMonthly?: string;
  polarProductIdSoloAnnual?: string;
  polarProductIdGrowthMonthly?: string;
  polarProductIdGrowthAnnual?: string;
}

export interface PlanFeatureConfig {
  id: "solo" | "growth";
  name: string;
  tagline: string;
  maxWebsites: number; // 3 for Solo, 25 for Growth (-1 for unlimited)
  maxFunnels: number; // 3 for Solo, -1 for Growth
  maxAlerts: number; // 3 for Solo, -1 for Growth
  hasSocialRadar: boolean; // X (Twitter) Social Radar
  retentionDays: number; // 365 (1 yr) for Solo, 1825 (5 yrs) for Growth
  mcpServer: boolean;
  mrrAttribution: boolean;
  unlimitedEventsSoftQuota: boolean;
  features: string[];
}

export const VOLUME_TIERS: PricingTier[] = [
  {
    events: 10_000,
    label: "10k",
    soloMonthly: 7,
    soloAnnual: 6,
    growthMonthly: 15,
    growthAnnual: 12,
  },
  {
    events: 100_000,
    label: "100k",
    soloMonthly: 19,
    soloAnnual: 15,
    growthMonthly: 39,
    growthAnnual: 31,
  },
  {
    events: 500_000,
    label: "500k",
    soloMonthly: 49,
    soloAnnual: 39,
    growthMonthly: 89,
    growthAnnual: 71,
  },
  {
    events: 2_000_000,
    label: "2m",
    soloMonthly: 119,
    soloAnnual: 95,
    growthMonthly: 189,
    growthAnnual: 151,
  },
  {
    events: 5_000_000,
    label: "5m",
    soloMonthly: 199,
    soloAnnual: 159,
    growthMonthly: 299,
    growthAnnual: 239,
  },
  {
    events: 20_000_000,
    label: "20m",
    soloMonthly: 349,
    soloAnnual: 279,
    growthMonthly: 549,
    growthAnnual: 439,
  },
];

export const PLANS: Record<"solo" | "growth", PlanFeatureConfig> = {
  solo: {
    id: "solo",
    name: "Solo Plan",
    tagline: "For indie founders, creators, and solo products.",
    maxWebsites: 3,
    maxFunnels: 3,
    maxAlerts: 3,
    hasSocialRadar: false,
    retentionDays: 365,
    mcpServer: true,
    mrrAttribution: true,
    unlimitedEventsSoftQuota: true,
    features: [
      "Up to 3 Websites",
      "Real-time ClickHouse OLAP Analytics",
      "Custom Proxy Subdomain (CNAME / SSL)",
      "Stripe & Polar MRR Attribution",
      "Model Context Protocol (MCP) AI Server",
      "3 Conversion Funnels & 3 Real-time Alerts",
      "1-Year Historical Data Retention",
      "Cookieless & 100% GDPR Compliant",
    ],
  },
  growth: {
    id: "growth",
    name: "Growth Plan",
    tagline: "For scaling startups and high-traffic platforms.",
    maxWebsites: 25,
    maxFunnels: -1,
    maxAlerts: -1,
    hasSocialRadar: true,
    retentionDays: 1825,
    mcpServer: true,
    mrrAttribution: true,
    unlimitedEventsSoftQuota: true,
    features: [
      "Up to 25 Websites",
      "X (Twitter) Social Radar Attribution",
      "Unlimited Conversion Funnels",
      "Unlimited Real-Time Email Alerts",
      "5-Year Historical Data Retention",
      "Custom Proxy Subdomain (CNAME / SSL)",
      "Priority Support & Dedicated Ingestion",
    ],
  },
};

/**
 * Helper to resolve user limits dynamically
 */
export function getPlanLimits(planId: string = "solo"): PlanFeatureConfig {
  return PLANS[planId as "solo" | "growth"] || PLANS.solo;
}
