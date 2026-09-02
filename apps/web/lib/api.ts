/**
 * Unified Type-Safe Frontend API Client for Analytika Backend
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  theme: "dark" | "light" | "system";
  emailDigest?: boolean;
  productAnnouncements?: boolean;
  plan: string;
  billingInterval?: "month" | "year";
  eventQuota: number;
  maxWebsites: number;
  maxFunnels: number;
  maxAlerts: number;
  hasSocialRadar: boolean;
  mcpApiKey: string | null;
  subscriptionStatus: "active" | "trialing" | "canceled" | "past_due" | string;
  trialEndsAt?: string | null;
  trialDaysRemaining?: number;
  currentPeriodEnd?: string | null;
  websitesCount?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  details?: any;
  data?: T;
  token?: string;
  user?: UserProfile;
  isRegistered?: boolean;
  status?: string;
}

// Session Token Storage with Bidirectional Persistence
export const tokenStorage = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    const local = localStorage.getItem("analytika_token");
    if (local && local.trim()) return local.trim();
    // Fallback: Check document.cookie
    const match = document.cookie.match(/(?:^|; )analytika_token=([^;]*)/);
    if (match && match[1]) {
      const cookieToken = decodeURIComponent(match[1]).trim();
      if (cookieToken) {
        localStorage.setItem("analytika_token", cookieToken);
        return cookieToken;
      }
    }
    return null;
  },
  set(token: string) {
    if (typeof window === "undefined" || !token) return;
    const cleanToken = token.trim();
    localStorage.setItem("analytika_token", cleanToken);
    document.cookie = `analytika_token=${cleanToken}; path=/; max-age=2592000; SameSite=Lax`;
  },
  clear() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("analytika_token");
    localStorage.removeItem("analytika_user");
    document.cookie = "analytika_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  },
};

/**
 * Base fetch wrapper with automatic token injection
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T> & (T extends object ? T : {})> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = tokenStorage.get();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401 && endpoint !== "/api/v1/auth/me") {
        tokenStorage.clear();
      }
      return {
        success: false,
        error: data.error || data.message || `Request failed with status ${res.status}`,
        details: data.details,
      } as any;
    }

    return data as ApiResponse<T> & (T extends object ? T : {});
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to connect to Analytika API server.",
    } as any;
  }
}

/**
 * Auth API Endpoints
 */
export const authApi = {
  // Step 1: Check if email exists
  async checkEmail(email: string) {
    return apiFetch<{ isRegistered: boolean }>("/api/v1/auth/check-email", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  // Step 2A: Request OTP code for email login
  async requestOtp(email: string) {
    return apiFetch<{ message: string }>("/api/v1/auth/otp/send", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  // Step 2B: Verify login code for existing user
  async verifyOtp(email: string, code: string) {
    return apiFetch<{ token: string; user: UserProfile }>("/api/v1/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    });
  },

  // Step 2C: Request registration code for new user
  async registerRequest(email: string, name?: string) {
    return apiFetch<{ message: string }>("/api/v1/auth/register-request", {
      method: "POST",
      body: JSON.stringify({ email, name }),
    });
  },

  // Step 2D: Confirm registration and activate 14-day Solo trial
  async registerConfirm(email: string, code: string, name?: string) {
    return apiFetch<{ token: string; user: UserProfile }>("/api/v1/auth/register-confirm", {
      method: "POST",
      body: JSON.stringify({ email, code, name }),
    });
  },

  // OAuth Login (Google / GitHub)
  async oauthLogin(params: {
    provider: "google" | "github";
    providerAccountId: string;
    email: string;
    name?: string;
    avatarUrl?: string;
  }) {
    return apiFetch<{ token: string; user: UserProfile }>("/api/v1/auth/oauth", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  // Get current authenticated user
  async getMe() {
    return apiFetch<{ user: UserProfile }>("/api/v1/auth/me", {
      method: "GET",
    });
  },

  // Update profile and preferences
  async updateProfile(data: {
    name?: string;
    theme?: "dark" | "light" | "system";
    emailDigest?: boolean;
    productAnnouncements?: boolean;
  }) {
    return apiFetch<{ user: UserProfile }>("/api/v1/auth/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  // Regenerate MCP Personal Access Key
  async regenerateMcpKey() {
    return apiFetch<{ mcpApiKey: string; user: UserProfile }>("/api/v1/auth/regenerate-mcp-key", {
      method: "POST",
    });
  },

  // Permanently delete account
  async deleteAccount() {
    return apiFetch<{ message: string }>("/api/v1/auth/me", {
      method: "DELETE",
    });
  },

  // Logout
  async logout() {
    return apiFetch<{ message: string }>("/api/v1/auth/logout", {
      method: "POST",
    });
  },
};

/**
 * Website Management Types
 */
export interface Website {
  id: string;
  userId: string;
  domain: string;
  name: string;
  timezone: string;
  currency: string;
  revenueModel?: "revenue" | "mrr" | "arr" | string;
  isPublic: boolean;
  sharePasswordHash: string | null;
  customProxyDomain: string | null;
  proxyVerified: boolean;
  allowLocalhost: boolean;
  ignoreMyVisits: boolean;
  blockedIps: string[];
  excludedPaths: string[];
  createdAt: string;
  updatedAt: string;
  monthlyVisitors?: number;
  monthlyRevenue?: number;
  sparkline?: number[];
}

export interface WebsiteListItem extends Website {
  monthlyVisitors: number;
  monthlyPageviews: number;
  monthlyRevenue?: number;
  trend: number;
  sparkline: number[];
}

export interface WebsiteSnippets {
  htmlScript: string;
  npmInstall: string;
  npmUsage: string;
}

export const websitesApi = {
  // List all websites owned by current user
  async list() {
    return apiFetch<{
      websites: WebsiteListItem[];
      meta: {
        count: number;
        maxWebsites: number;
        canAdd: boolean;
        plan: string;
      };
    }>("/api/v1/websites");
  },

  // Create new website
  async create(data: { domain: string; name?: string; timezone?: string; currency?: string }) {
    return apiFetch<{
      website: Website;
      snippets: WebsiteSnippets;
    }>("/api/v1/websites", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Get single website by ID
  async get(id: string) {
    return apiFetch<{
      website: Website;
      snippets: WebsiteSnippets;
    }>(`/api/v1/websites/${id}`);
  },

  // Update website settings
  async update(
    id: string,
    data: {
      name?: string;
      timezone?: string;
      currency?: string;
      revenueModel?: string;
      isPublic?: boolean;
      customProxyDomain?: string;
      allowLocalhost?: boolean;
      ignoreMyVisits?: boolean;
      blockedIps?: string[];
      excludedPaths?: string[];
      hasPassword?: boolean;
      sharePassword?: string | null;
    }
  ) {
    return apiFetch<{ website: Website }>(`/api/v1/websites/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  // Verify custom proxy domain CNAME DNS
  async verifyProxy(id: string) {
    return apiFetch<{
      verified: boolean;
      website: Website;
      message: string;
    }>(`/api/v1/websites/${id}/verify-proxy`, {
      method: "POST",
    });
  },

  // Delete website
  async delete(id: string) {
    return apiFetch<{ message: string }>(`/api/v1/websites/${id}`, {
      method: "DELETE",
    });
  },

  // Reset all analytics events for a website
  async resetData(id: string) {
    return apiFetch<{ success: boolean; message: string }>(`/api/v1/websites/${id}/reset-data`, {
      method: "POST",
    });
  },

  // Get public website info for shared dashboard (No auth required)
  async getPublic(id: string) {
    return apiFetch<{
      website: {
        id: string;
        domain: string;
        name: string;
        timezone: string;
        currency: string;
        revenueModel: string;
        isPublic: boolean;
        hasPin: boolean;
      };
    }>(`/api/v1/websites/${id}/public`);
  },

  // Verify PIN code for password-protected public share dashboard
  async verifyPin(id: string, pin: string) {
    return apiFetch<{
      verified: boolean;
    }>(`/api/v1/websites/${id}/verify-pin`, {
      method: "POST",
      body: JSON.stringify({ pin }),
    });
  },
};

/**
 * Plans & Dynamic Pricing Models
 */
export interface PricingTier {
  events: number;
  label: string;
  soloMonthly: number;
  soloAnnual: number;
  growthMonthly: number;
  growthAnnual: number;
}

export interface PlanFeatureConfig {
  id: "solo" | "growth";
  name: string;
  tagline: string;
  maxWebsites: number;
  maxFunnels: number;
  maxAlerts: number;
  hasSocialRadar: boolean;
  retentionDays: number;
  mcpServer: boolean;
  mrrAttribution: boolean;
  unlimitedEventsSoftQuota: boolean;
  features: string[];
}

export const plansApi = {
  // Get all plans and dynamic volume pricing tiers
  async get() {
    return apiFetch<{
      plans: Record<"solo" | "growth", PlanFeatureConfig>;
      tiers: PricingTier[];
    }>("/api/v1/plans");
  },
};

/**
 * Analytics Data Models
 */
export interface OverviewMetrics {
  visitors: number;
  pageviews: number;
  sessions: number;
  bounceRate: number;
  avgSessionDurationSeconds: number;
  revenue: number;
  purchases: number;
}

export interface TimeseriesPoint {
  date: string;
  visitors: number;
  pageviews: number;
  revenue: number;
}

export interface SourceItem {
  name: string;
  source?: string;
  visitors: number;
  pageviews: number;
}

export interface PageItem {
  path: string;
  title: string;
  visitors: number;
  pageviews: number;
}

export interface CountryItem {
  code: string;
  visitors: number;
  pageviews: number;
}

export interface RegionItem {
  name: string;
  country: string;
  visitors: number;
  pageviews: number;
}

export interface CityItem {
  name: string;
  country: string;
  region: string;
  visitors: number;
  pageviews: number;
}

export interface LanguageItem {
  code: string;
  name: string;
  visitors: number;
  pageviews: number;
}

export interface DeviceItem {
  name: string;
  visitors: number;
  pageviews: number;
}

export interface CustomEventItem {
  name: string;
  totalCount: number;
  uniqueVisitors: number;
  totalValue: number;
  currency: string;
}

export const analyticsApi = {
  // Live active visitors (last 5 min)
  async getLive(siteId: string) {
    return apiFetch<{ onlineVisitors: number }>(`/api/v1/analytics/${siteId}/live`);
  },

  // Overview metric cards
  async getOverview(siteId: string, range: string = "30d", from?: string, to?: string) {
    const params = new URLSearchParams({ range });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return apiFetch<{ metrics: OverviewMetrics }>(`/api/v1/analytics/${siteId}/overview?${params.toString()}`);
  },

  // Timeseries spline graph
  async getTimeseries(siteId: string, range: string = "30d", from?: string, to?: string) {
    const params = new URLSearchParams({ range });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return apiFetch<{ timeseries: TimeseriesPoint[]; interval: string }>(`/api/v1/analytics/${siteId}/timeseries?${params.toString()}`);
  },

  // Traffic sources (Channels, Referrers, Campaigns)
  async getSources(siteId: string, range: string = "30d") {
    return apiFetch<{
      channels: SourceItem[];
      referrers: SourceItem[];
      campaigns: SourceItem[];
    }>(`/api/v1/analytics/${siteId}/sources?range=${range}`);
  },

  // Top Pages
  async getPages(siteId: string, range: string = "30d") {
    return apiFetch<{ pages: PageItem[] }>(`/api/v1/analytics/${siteId}/pages?range=${range}`);
  },

  // Geography (Countries, Regions, Cities & Languages)
  async getGeo(siteId: string, range: string = "30d") {
    return apiFetch<{ countries: CountryItem[]; regions: RegionItem[]; cities: CityItem[]; languages: LanguageItem[] }>(`/api/v1/analytics/${siteId}/geo?range=${range}`);
  },

  // Technology (Browsers, OS, Devices, Screens, Loyalty)
  async getDevices(siteId: string, range: string = "30d") {
    return apiFetch<{
      browsers: DeviceItem[];
      os: DeviceItem[];
      devices: DeviceItem[];
      screens: DeviceItem[];
      loyalty?: { newVisitors: number; returningVisitors: number };
    }>(`/api/v1/analytics/${siteId}/devices?range=${range}`);
  },

  // Custom Events breakdown
  async getEvents(siteId: string, range: string = "30d") {
    return apiFetch<{ events: CustomEventItem[] }>(`/api/v1/analytics/${siteId}/events?range=${range}`);
  },

  // Social Mention Radar (X & Reddit)
  async getSocialRadar(siteId: string, timeRange: string = "30 Days") {
    const params = new URLSearchParams({ timeRange });
    return apiFetch<SocialRadarData>(`/api/v1/analytics/${siteId}/social-radar?${params.toString()}`);
  },
};

export interface SocialMentionItem {
  id: string;
  websiteId: string;
  platform: "x" | "reddit";
  externalId: string;
  authorName: string;
  authorHandle: string;
  authorAvatarUrl?: string | null;
  content: string;
  url: string;
  likes: number;
  reposts: number;
  replies: number;
  postedAt: string;
  createdAt: string;
}

export interface SocialRadarTimeseriesPoint {
  date: string;
  label?: string;
  x: number;
  reddit: number;
  total: number;
}

export interface SocialRadarStats {
  totalMentions: number;
  xCount: number;
  redditCount: number;
  totalEngagements: number;
  topPost: SocialMentionItem | null;
}

export interface SocialRadarData {
  success: boolean;
  domain: string;
  planRestricted?: boolean;
  mentions: SocialMentionItem[];
  timeseries: SocialRadarTimeseriesPoint[];
  stats: SocialRadarStats;
}

export interface MilestoneItem {
  id: string;
  name: string;
  type: "event" | "pageview" | "revenue";
  trigger: string;
  rawTrigger?: string;
  completions: number;
  conversionRate: number;
  targetCount: number;
  revenue: number;
  topSource: { name: string; rate: number };
  trend: number;
}

export const milestonesApi = {
  async list(siteId: string, range: string = "30d") {
    return apiFetch<{ milestones: MilestoneItem[] }>(`/api/v1/websites/${siteId}/milestones?range=${range}`);
  },

  async create(
    siteId: string,
    data: {
      name: string;
      type: "event" | "pageview" | "revenue";
      trigger: string;
      targetCount: number;
      revenuePerCompletion?: number;
    }
  ) {
    return apiFetch<{ milestone: MilestoneItem }>(`/api/v1/websites/${siteId}/milestones`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async delete(siteId: string, id: string) {
    return apiFetch<{ success: boolean }>(`/api/v1/websites/${siteId}/milestones/${id}`, {
      method: "DELETE",
    });
  },
};

export interface FunnelStepItem {
  id?: string;
  name: string;
  type: "page" | "event" | "pageview";
  path?: string;
  eventId?: string;
  condition?: "completed" | "does_not_complete";
  users?: number;
  percentage?: number;
  dropOffRate?: number;
}

export interface FunnelItem {
  id: string;
  name: string;
  steps: FunnelStepItem[];
}

export const funnelsApi = {
  async list(siteId: string, range: string = "30d") {
    return apiFetch<{ funnels: FunnelItem[] }>(`/api/v1/websites/${siteId}/funnels?range=${range}`);
  },

  async create(siteId: string, data: { name: string; steps: FunnelStepItem[] }) {
    return apiFetch<{ funnel: FunnelItem }>(`/api/v1/websites/${siteId}/funnels`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(siteId: string, funnelId: string, data: { name: string; steps: FunnelStepItem[] }) {
    return apiFetch<{ funnel: FunnelItem }>(`/api/v1/websites/${siteId}/funnels/${funnelId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(siteId: string, funnelId: string) {
    return apiFetch<{ success: boolean }>(`/api/v1/websites/${siteId}/funnels/${funnelId}`, {
      method: "DELETE",
    });
  },
};

export interface AlertItem {
  id: string;
  websiteId: string;
  name: string;
  eventId: string;
  icon: string;
  enabled: boolean;
  subject: string;
  body: string;
  lastTriggered?: string;
  createdAt: string;
}

export const alertsApi = {
  async list(websiteId: string) {
    return apiFetch<{ alerts: AlertItem[] }>(`/api/v1/websites/${websiteId}/alerts`);
  },

  async create(
    websiteId: string,
    data: {
      name: string;
      eventId: string;
      icon?: string;
      enabled?: boolean;
      subject: string;
      body: string;
    }
  ) {
    return apiFetch<{ alert: AlertItem }>(`/api/v1/websites/${websiteId}/alerts`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(
    alertId: string,
    data: {
      name?: string;
      eventId?: string;
      icon?: string;
      enabled?: boolean;
      subject?: string;
      body?: string;
    }
  ) {
    return apiFetch<{ alert: AlertItem }>(`/api/v1/alerts/${alertId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async delete(alertId: string) {
    return apiFetch<{ success: boolean }>(`/api/v1/alerts/${alertId}`, {
      method: "DELETE",
    });
  },

  async sendTest(data: {
    name?: string;
    eventId?: string;
    domain?: string;
    subject: string;
    body: string;
  }) {
    return apiFetch<{ success: boolean; message: string }>("/api/v1/alerts/test", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

/**
 * Payment Integrations API
 */
export interface PaymentIntegration {
  id: string;
  platform: "stripe" | "polar" | "dodo" | "paddle" | "lemonsqueezy";
  apiKeyMasked: string | null;
  storeId?: string | null;
  isConnected: boolean;
  autoAttribution: boolean;
  connectedAt?: string | null;
  lastSyncedAt?: string | null;
}

export const paymentsApi = {
  async list(websiteId: string) {
    return apiFetch<{ success: boolean; integrations: PaymentIntegration[] }>(
      `/api/v1/websites/${websiteId}/payments`
    );
  },

  async connect(
    websiteId: string,
    data: {
      platform: "stripe" | "polar" | "dodo" | "paddle" | "lemonsqueezy";
      apiKey: string;
      storeId?: string;
      autoAttribution?: boolean;
    }
  ) {
    return apiFetch<{
      success: boolean;
      integration: PaymentIntegration;
      message: string;
    }>(`/api/v1/websites/${websiteId}/payments/connect`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async disconnect(
    websiteId: string,
    platform: "stripe" | "polar" | "dodo" | "paddle" | "lemonsqueezy"
  ) {
    return apiFetch<{ success: boolean; message: string }>(
      `/api/v1/websites/${websiteId}/payments/disconnect`,
      {
        method: "POST",
        body: JSON.stringify({ platform }),
      }
    );
  },

  async updateAttribution(
    websiteId: string,
    platform: "stripe" | "polar" | "dodo" | "paddle" | "lemonsqueezy",
    autoAttribution: boolean
  ) {
    return apiFetch<{ success: boolean; message: string }>(
      `/api/v1/websites/${websiteId}/payments/attribution`,
      {
        method: "PATCH",
        body: JSON.stringify({ platform, autoAttribution }),
      }
    );
  },
};

export interface BillingSubscription {
  plan: string;
  planName: string;
  billingInterval: "month" | "year";
  status: "active" | "trialing" | "canceled" | "past_due";
  eventQuota: number;
  eventUsage: number;
  usagePercentage: number;
  trialEndsAt: string | null;
  trialDaysRemaining: number;
  currentPeriodEnd: string | null;
  hasPolarSubscription: boolean;
  limits: {
    maxWebsites: number;
    maxFunnels: number;
    maxAlerts: number;
    hasSocialRadar: boolean;
    retentionDays: number;
  };
}

export const billingApi = {
  async getStatus() {
    return apiFetch<{ success: boolean; subscription: BillingSubscription }>(
      "/api/v1/billing/status"
    );
  },

  async createCheckout(data: {
    plan: "solo" | "growth";
    interval: "month" | "year";
    tierEvents: number;
  }) {
    return apiFetch<{ success: boolean; checkoutUrl: string; mock?: boolean }>(
      "/api/v1/billing/checkout",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  },

  async getPortalSession() {
    return apiFetch<{ success: boolean; portalUrl: string }>(
      "/api/v1/billing/portal",
      {
        method: "POST",
      }
    );
  },

  async cancelSubscription() {
    return apiFetch<{
      success: boolean;
      message: string;
      currentPeriodEnd: string | null;
    }>("/api/v1/billing/cancel", {
      method: "POST",
    });
  },

  async resumeSubscription() {
    return apiFetch<{ success: boolean; message: string }>(
      "/api/v1/billing/resume",
      {
        method: "POST",
      }
    );
  },
};

