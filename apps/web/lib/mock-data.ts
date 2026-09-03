/**
 * Mock analytics data for the landing page interactive demo.
 * Simulates a 30-day window for "google.com" with realistic distributions.
 */

// --- Timeseries (30 days, daily) ---
function d(offset: number): string {
  const date = new Date("2026-09-03T00:00:00Z");
  date.setUTCDate(date.getUTCDate() - (29 - offset));
  return date.toISOString().slice(0, 10).replace("T", " ") + " 00:00:00";
}

const BASE = 3800;
const NOISE = [0.82, 0.91, 1.05, 0.97, 1.12, 0.88, 0.76, 0.94, 1.08, 1.21, 1.03, 0.89, 0.95, 1.14, 1.07, 0.92, 0.85, 1.18, 1.24, 1.09, 0.96, 0.88, 1.02, 1.15, 1.27, 1.09, 1.01, 0.93, 1.19, 1.31];

export const MOCK_TIMESERIES = NOISE.map((n, i) => {
  const visitors = Math.round(BASE * n);
  const pageviews = Math.round(visitors * (1.6 + Math.random() * 0.4));
  const revenue = Math.round(visitors * (0.009 + Math.random() * 0.003) * 100) / 100;
  const returningVisitors = Math.round(visitors * 0.34);
  const newVisitors = visitors - returningVisitors;
  return {
    date: d(i),
    label: new Date(d(i).replace(" ", "T") + "Z").toLocaleDateString([], { month: "short", day: "numeric" }),
    visitors,
    pageviews,
    revenue,
    newVisitors,
    returningVisitors,
    conversionRate: Math.round((revenue / visitors) * 1000) / 10,
    bounceRate: Math.round((38 + Math.random() * 12) * 10) / 10,
    sessionTime: Math.round(120 + Math.random() * 90),
  };
});

// --- KPI Totals ---
export const MOCK_OVERVIEW = {
  visitors: MOCK_TIMESERIES.reduce((s, r) => s + r.visitors, 0),
  pageviews: MOCK_TIMESERIES.reduce((s, r) => s + r.pageviews, 0),
  sessions: Math.round(MOCK_TIMESERIES.reduce((s, r) => s + r.visitors, 0) * 1.12),
  revenue: Math.round(MOCK_TIMESERIES.reduce((s, r) => s + r.revenue, 0)),
  purchases: 847,
  bounceRate: 42.3,
  avgSessionDurationSeconds: 164,
};

// --- Traffic Channels ---
export const MOCK_CHANNELS = [
  { name: "Organic Search", views: 38240, percentage: 38, domain: "google.com" },
  { name: "Direct",         views: 22180, percentage: 22, domain: null },
  { name: "Social",         views: 18310, percentage: 18, domain: "twitter.com" },
  { name: "Referral",       views: 12050, percentage: 12, domain: null },
  { name: "Email",          views:  7080, percentage:  7, domain: null },
  { name: "Paid",           views:  3120, percentage:  3, domain: null },
];

// --- Referrers ---
export const MOCK_REFERRERS = [
  { name: "twitter.com",        views: 9820,  percentage: 32, domain: "twitter.com" },
  { name: "producthunt.com",    views: 6430,  percentage: 21, domain: "producthunt.com" },
  { name: "news.ycombinator.com", views: 5110, percentage: 17, domain: "news.ycombinator.com" },
  { name: "reddit.com",         views: 4290,  percentage: 14, domain: "reddit.com" },
  { name: "linkedin.com",       views: 3050,  percentage: 10, domain: "linkedin.com" },
  { name: "github.com",         views: 1860,  percentage:  6, domain: "github.com" },
];

// --- UTM Campaigns ---
export const MOCK_CAMPAIGNS = [
  { name: "summer_launch_2026",  views: 7840, percentage: 41 },
  { name: "ph_featured_day",     views: 5120, percentage: 27 },
  { name: "newsletter_aug26",    views: 3680, percentage: 19 },
  { name: "retargeting_q3",      views: 2410, percentage: 13 },
];

// --- Top Pages ---
export const MOCK_PAGES = [
  { name: "/",                    views: 34120, percentage: 34 },
  { name: "/pricing",             views: 18640, percentage: 19 },
  { name: "/docs",                views: 12390, percentage: 12 },
  { name: "/blog/cookieless-analytics", views: 9810, percentage: 10 },
  { name: "/dashboard",           views: 7240,  percentage:  7 },
  { name: "/auth/login",          views: 6180,  percentage:  6 },
  { name: "/blog",                views: 4930,  percentage:  5 },
  { name: "/changelog",           views: 3210,  percentage:  3 },
];

// --- Countries ---
export const MOCK_COUNTRIES = [
  { name: "United States",    code: "us", views: 31200, percentage: 31 },
  { name: "United Kingdom",   code: "gb", views: 14800, percentage: 15 },
  { name: "Germany",          code: "de", views:  9400, percentage:  9 },
  { name: "Canada",           code: "ca", views:  8200, percentage:  8 },
  { name: "France",           code: "fr", views:  6800, percentage:  7 },
  { name: "Netherlands",      code: "nl", views:  5100, percentage:  5 },
  { name: "Australia",        code: "au", views:  4600, percentage:  5 },
  { name: "India",            code: "in", views:  4200, percentage:  4 },
  { name: "Brazil",           code: "br", views:  3100, percentage:  3 },
  { name: "Japan",            code: "jp", views:  2900, percentage:  3 },
];

// --- Browsers ---
export const MOCK_BROWSERS = [
  { name: "Chrome",  views: 48320, percentage: 48, domain: "chrome.com" },
  { name: "Safari",  views: 24180, percentage: 24, domain: "apple.com" },
  { name: "Firefox", views: 11090, percentage: 11, domain: "firefox.com" },
  { name: "Edge",    views:  9040, percentage:  9, domain: "microsoft.com" },
  { name: "Brave",   views:  5610, percentage:  6, domain: "brave.com" },
  { name: "Arc",     views:  2760, percentage:  2, domain: "arc.net" },
];

// --- Operating Systems ---
export const MOCK_OS = [
  { name: "macOS",      views: 38120, percentage: 38, domain: "apple.com" },
  { name: "Windows 10/11", views: 29840, percentage: 30, domain: "microsoft.com" },
  { name: "iOS",        views: 16420, percentage: 16, domain: "apple.com" },
  { name: "Android",    views: 10180, percentage: 10, domain: "android.com" },
  { name: "Linux",      views:  5440, percentage:  5, domain: "ubuntu.com" },
];

// --- Device Types ---
export const MOCK_DEVICES = [
  { name: "Desktop", views: 62140, percentage: 62, lucide: "Monitor" },
  { name: "Mobile",  views: 28390, percentage: 28, lucide: "Smartphone" },
  { name: "Tablet",  views:  9470, percentage: 10, lucide: "Tablet" },
];

// --- Custom Events ---
export const MOCK_EVENTS = [
  { name: "signup_completed",     views: 3840, percentage: 31, lucide: "Sparkles" },
  { name: "subscription_started", views: 2190, percentage: 18, lucide: "CreditCard" },
  { name: "pricing_page_viewed",  views: 1870, percentage: 15, lucide: "Activity" },
  { name: "demo_requested",       views: 1240, percentage: 10, lucide: "Zap" },
  { name: "docs_opened",          views: 1080, percentage:  9, lucide: "FileText" },
  { name: "purchase",             views:  847, percentage:  7, lucide: "CreditCard" },
  { name: "newsletter_signup",    views:  630, percentage:  5, lucide: "Mail" },
  { name: "cta_clicked",          views:  580, percentage:  5, lucide: "MousePointerClick" },
];

// --- Live online visitors (static for demo) ---
export const MOCK_ONLINE = 47;
