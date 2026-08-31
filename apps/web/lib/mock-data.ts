// Shared mock data based on the real ClickHouse schema

export function generateRealisticMetrics(timeRange: "Today" | "Last 24h" | "7 Days" | "30 Days" | "YTD" | "Custom...", seed = 1) {
  const pointsCount = timeRange === "Last 24h" || timeRange === "Today" ? 24 : timeRange === "7 Days" ? 7 : timeRange === "30 Days" ? 30 : 12;
  const now = new Date();
  const points = [];

  const base = timeRange === "Last 24h" || timeRange === "Today" ? 180 : timeRange === "7 Days" ? 2600 : timeRange === "30 Days" ? 1950 : 29000;

  for (let i = pointsCount - 1; i >= 0; i--) {
    const d = new Date(now);
    let label = "";

    if (timeRange === "Last 24h" || timeRange === "Today") {
      d.setHours(now.getHours() - i);
      label = `${d.getHours().toString().padStart(2, "0")}:00`;
    } else if (timeRange === "7 Days" || timeRange === "30 Days") {
      d.setDate(now.getDate() - i);
      label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } else {
      // Fix Javascript Date API bug where months with 31 days skip short months (e.g. Feb)
      d.setDate(1);
      d.setMonth(now.getMonth() - i);
      label = d.toLocaleDateString("en-US", { month: "short" });
    }

    const progress = (pointsCount - i) / pointsCount;
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const weekendDrop = isWeekend ? 0.78 : 1.05;
    const macroTrend = 0.85 + Math.sin(progress * Math.PI * 1.5) * 0.18 + progress * 0.22;
    const microVariation = 0.96 + (Math.sin((i + seed) * 0.7) * 0.06);

    const visitors = Math.max(25, Math.round(base * weekendDrop * macroTrend * microVariation));
    const pageviews = Math.round(visitors * 2.24);
    const revenue = Math.round(visitors * 1.78);

    // Add conversion rate, bounce rate, and session time variations deterministically
    const pseudoRandom = Math.abs(Math.sin(i * 12.9898 + seed)) * 43758.5453;
    const randomFrac = pseudoRandom - Math.floor(pseudoRandom);

    const bounceRate = 30 + randomFrac * 20; // 30-50%
    const sessionTime = 120 + randomFrac * 180; // 2 to 5 mins (in seconds)
    const conversionRate = 2 + randomFrac * 4; // 2-6%

    points.push({
      label,
      date: d.toISOString().split("T")[0],
      visitors,
      pageviews,
      revenue,
      bounceRate,
      sessionTime,
      conversionRate
    });
  }

  return points;
}

export const mockAcquisition = {
  channels: [
    { name: "Direct", views: 24500, percentage: 22, icon: "Globe", domain: null },
    { name: "Google", views: 18200, percentage: 16, icon: "Search", domain: "google.com" },
    { name: "Twitter", views: 14500, percentage: 13, icon: "Twitter", domain: "twitter.com" },
    { name: "Facebook", views: 9400, percentage: 8, icon: "Share2", domain: "facebook.com" },
    { name: "LinkedIn", views: 8200, percentage: 7, icon: "Linkedin", domain: "linkedin.com" },
    { name: "Reddit", views: 7600, percentage: 6, icon: "MessageSquare", domain: "reddit.com" },
    { name: "YouTube", views: 6500, percentage: 5, icon: "Youtube", domain: "youtube.com" },
    { name: "Medium", views: 6400, percentage: 5, icon: "Link", domain: "medium.com" },
    { name: "Instagram", views: 5100, percentage: 4, icon: "Instagram", domain: "instagram.com" },
    { name: "ProductHunt", views: 4300, percentage: 4, icon: "ProductHunt", domain: "producthunt.com" },
    { name: "HackerNews", views: 3200, percentage: 3, icon: "HackerNews", domain: "ycombinator.com" },
    { name: "TikTok", views: 2500, percentage: 2, icon: "TikTok", domain: "tiktok.com" },
    { name: "Pinterest", views: 1200, percentage: 1, icon: "Pinterest", domain: "pinterest.com" },
    { name: "Bing", views: 800, percentage: 1, icon: "Search", domain: "bing.com" },
  ],
  referrers: [
    { name: "Google", views: 32000, percentage: 28, domain: "google.com" },
    { name: "X (Twitter)", views: 15000, percentage: 13, domain: "x.com" },
    { name: "Y Combinator", views: 12000, percentage: 11, domain: "ycombinator.com" },
    { name: "LinkedIn", views: 9500, percentage: 8, domain: "linkedin.com" },
    { name: "Product Hunt", views: 8200, percentage: 7, domain: "producthunt.com" },
    { name: "Reddit", views: 7600, percentage: 7, domain: "reddit.com" },
    { name: "Bing", views: 6000, percentage: 5, domain: "bing.com" },
    { name: "DuckDuckGo", views: 4500, percentage: 4, domain: "duckduckgo.com" },
    { name: "GitHub", views: 3800, percentage: 3, domain: "github.com" },
    { name: "Dev.to", views: 3200, percentage: 3, domain: "dev.to" },
    { name: "Medium", views: 2800, percentage: 2, domain: "medium.com" },
    { name: "HackerNoon", views: 2400, percentage: 2, domain: "hackernoon.com" },
    { name: "Facebook", views: 2100, percentage: 2, domain: "facebook.com" },
    { name: "StackOverflow", views: 1800, percentage: 2, domain: "stackoverflow.com" },
    { name: "Yahoo", views: 1200, percentage: 1, domain: "yahoo.com" },
  ],
  campaigns: [
    { name: "summer_sale (google / cpc)", views: 8500, percentage: 35 },
    { name: "newsletter_aug (email / direct)", views: 6200, percentage: 25 },
    { name: "product_hunt_launch (ph / social)", views: 4800, percentage: 20 },
    { name: "influencer_x (twitter / social)", views: 3200, percentage: 13 },
    { name: "retargeting_v2 (fb / cpc)", views: 1800, percentage: 7 },
  ]
};

export const mockLocation = {
  countries: [
    { name: "United States", code: "US", views: 46000, percentage: 46 },
    { name: "United Kingdom", code: "GB", views: 15000, percentage: 15 },
    { name: "Germany", code: "DE", views: 12000, percentage: 12 },
    { name: "France", code: "FR", views: 9000, percentage: 9 },
    { name: "Japan", code: "JP", views: 8000, percentage: 8 },
  ],
  regions: [
    { name: "California", code: "US", views: 18000, percentage: 25 },
    { name: "New York", code: "US", views: 12000, percentage: 18 },
    { name: "England", code: "GB", views: 9000, percentage: 12 },
    { name: "Bavaria", code: "DE", views: 5000, percentage: 8 },
    { name: "Dubai", code: "AE", views: 4500, percentage: 7 },
  ],
  cities: [
    { name: "San Francisco", code: "US", views: 12000, percentage: 15 },
    { name: "London", code: "GB", views: 8500, percentage: 10 },
    { name: "New York", code: "US", views: 7000, percentage: 8 },
    { name: "Berlin", code: "DE", views: 5500, percentage: 6 },
    { name: "Dubai", code: "AE", views: 4000, percentage: 5 },
  ]
};

export const mockTech = {
  browsers: [
    { name: "Chrome", views: 42000, percentage: 55, domain: "google.com" },
    { name: "Safari", views: 21000, percentage: 28, domain: "apple.com" },
    { name: "Firefox", views: 6500, percentage: 8, domain: "firefox.com" },
    { name: "Edge", views: 4000, percentage: 5, domain: "microsoft.com" },
    { name: "Brave", views: 2500, percentage: 3, domain: "brave.com" },
  ],
  os: [
    { name: "Windows", views: 35000, percentage: 46, domain: "microsoft.com" },
    { name: "macOS", views: 22000, percentage: 29, domain: "apple.com" },
    { name: "iOS", views: 12000, percentage: 16, domain: "apple.com" },
    { name: "Android", views: 6000, percentage: 8, domain: "android.com" },
    { name: "Linux", views: 1000, percentage: 1, domain: "linux.org" },
  ],
  devices: [
    { name: "Desktop", views: 48000, percentage: 63, lucide: "Monitor" },
    { name: "Mobile", views: 24000, percentage: 32, lucide: "Smartphone" },
    { name: "Tablet", views: 4000, percentage: 5, lucide: "Tablet" },
  ]
};

export const mockFunnels = [
  {
    id: "f1",
    name: "User Onboarding",
    steps: [
      { name: "Homepage Visit", users: 15200, percentage: 100 },
      { name: "Pricing Page", users: 6840, percentage: 45 },
      { name: "Sign Up Form", users: 3120, percentage: 20 },
      { name: "Email Verified", users: 2650, percentage: 17 },
      { name: "Purchased Pro", users: 1216, percentage: 8 },
    ],
  },
  {
    id: "f2",
    name: "Checkout Flow",
    steps: [
      { name: "Cart View", users: 8500, percentage: 100 },
      { name: "Checkout Started", users: 5100, percentage: 60 },
      { name: "Payment Entered", users: 4250, percentage: 50 },
      { name: "Order Completed", users: 3825, percentage: 45 },
    ],
  },
];

export const mockGoals = [
  { id: "g1", name: "10k Monthly Signups", target: 10000, current: 8450 },
  { id: "g2", name: "$50k MRR", target: 50000, current: 32000 },
  { id: "g3", name: "Reduce Bounce Rate < 40%", target: 40, current: 48, inverse: true },
];

export const mockEvents = {
  all: [
    { name: "Sign Up Clicked", views: 8420, percentage: 38, lucide: "MousePointerClick" },
    { name: "Pricing Plan Selected", views: 4950, percentage: 22, lucide: "CreditCard" },
    { name: "Documentation Downloaded", views: 3200, percentage: 14, lucide: "Download" },
    { name: "Demo Video Played", views: 2840, percentage: 13, lucide: "Play" },
    { name: "Newsletter Subscribed", views: 1850, percentage: 8, lucide: "Mail" },
    { name: "Checkout Initiated", views: 1120, percentage: 5, lucide: "ShoppingCart" },
  ],
  actions: [
    { name: "Sign Up Clicked", views: 8420, percentage: 52, lucide: "MousePointerClick" },
    { name: "Documentation Downloaded", views: 3200, percentage: 26, lucide: "Download" },
    { name: "Demo Video Played", views: 2840, percentage: 22, lucide: "Play" },
  ],
  conversions: [
    { name: "Pricing Plan Selected", views: 4950, percentage: 63, lucide: "CreditCard" },
    { name: "Newsletter Subscribed", views: 1850, percentage: 23, lucide: "Mail" },
    { name: "Checkout Initiated", views: 1120, percentage: 14, lucide: "ShoppingCart" },
  ]
};
