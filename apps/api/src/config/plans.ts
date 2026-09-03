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
  hasSocialRadar: boolean; // Reddit & X (Twitter) Social Radar
  retentionDays: number; // 365 (1 yr) for Solo, 1825 (5 yrs) for Growth
  mcpServer: boolean;
  mrrAttribution: boolean;
  unlimitedEventsSoftQuota: boolean;
  features: string[];
}

export const VOLUME_TIERS: PricingTier[] = [
  {
    events: 10000,
    label: "10k",
    soloMonthly: 7,
    soloAnnual: 6,
    growthMonthly: 15,
    growthAnnual: 12,
    polarProductIdSoloMonthly: "27427687-c8cb-4ade-a466-dca3523773a1",
    polarProductIdSoloAnnual: "a7071c42-0c7a-4f02-b568-85088e58af08",
    polarProductIdGrowthMonthly: "0ce60bab-67e6-4543-955e-bf0bb2e269ff",
    polarProductIdGrowthAnnual: "ecbbeccb-bab0-40ad-8a08-5a61d55c0c3e",
  },
  {
    events: 100000,
    label: "100k",
    soloMonthly: 19,
    soloAnnual: 15,
    growthMonthly: 39,
    growthAnnual: 31,
    polarProductIdSoloMonthly: "02d66a20-d56e-453d-b78e-54d436f60323",
    polarProductIdSoloAnnual: "463de49a-b87e-4e8f-8a1e-50bb89e7c987",
    polarProductIdGrowthMonthly: "aaecc6a1-f465-45f3-9208-8983a12ee1a6",
    polarProductIdGrowthAnnual: "0feff1a8-8ee4-44d1-acb4-0a9e2ad6eeda",
  },
  {
    events: 500000,
    label: "500k",
    soloMonthly: 49,
    soloAnnual: 39,
    growthMonthly: 89,
    growthAnnual: 71,
    polarProductIdSoloMonthly: "827b1a73-a65f-4d8e-b6c4-5c7586041388",
    polarProductIdSoloAnnual: "2129d254-d12e-49ed-a3aa-6ec07db212ab",
    polarProductIdGrowthMonthly: "d3169bc7-89a9-41e0-986d-a02248ac9d91",
    polarProductIdGrowthAnnual: "d55b1bc0-7c7a-4d20-b27c-25014b44ad5b",
  },
  {
    events: 2000000,
    label: "2m",
    soloMonthly: 119,
    soloAnnual: 95,
    growthMonthly: 189,
    growthAnnual: 151,
    polarProductIdSoloMonthly: "321a6ade-54fc-4523-b3cc-6694db9cb56d",
    polarProductIdSoloAnnual: "6d75935a-805f-4f23-86ac-b3b815d83502",
    polarProductIdGrowthMonthly: "aba4e284-5a45-421a-8d5b-fe40343777bf",
    polarProductIdGrowthAnnual: "73d01e17-3261-4448-9c36-941f6da07dfc",
  },
  {
    events: 5000000,
    label: "5m",
    soloMonthly: 199,
    soloAnnual: 159,
    growthMonthly: 299,
    growthAnnual: 239,
    polarProductIdSoloMonthly: "cc757786-3f1c-4a74-ba51-97972c2d0c29",
    polarProductIdSoloAnnual: "1f6957c8-0b00-4d69-b5cb-5cc8d99fe9bd",
    polarProductIdGrowthMonthly: "7fcb23ce-f36f-483c-b33b-0ef48a20ee01",
    polarProductIdGrowthAnnual: "e6c175b1-2ea6-43d7-bdc7-35c3f728a8cb",
  },
  {
    events: 20000000,
    label: "20m",
    soloMonthly: 349,
    soloAnnual: 279,
    growthMonthly: 549,
    growthAnnual: 439,
    polarProductIdSoloMonthly: "aa4326a6-44f1-423d-9516-2066fa6a1d91",
    polarProductIdSoloAnnual: "623f89ba-5628-417c-b46d-7b921b37a421",
    polarProductIdGrowthMonthly: "fe7d4642-3c81-4867-99fe-2d8527041009",
    polarProductIdGrowthAnnual: "8df44bf6-40ea-4e2d-8df9-6a9dcc9de9ee",
  }
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
      "Real-time Traffic & Event Analytics",
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
      "Reddit & X (Twitter) Social Radar Attribution",
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
