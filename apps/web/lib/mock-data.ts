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
    
    // Add conversion rate, bounce rate, and session time variations
    const bounceRate = 30 + Math.random() * 20; // 30-50%
    const sessionTime = 120 + Math.random() * 180; // 2 to 5 mins (in seconds)
    const conversionRate = 2 + Math.random() * 4; // 2-6%

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
    { name: "Organic Search", views: 45000, percentage: 45 },
    { name: "Direct", views: 25000, percentage: 25 },
    { name: "Social Media", views: 15000, percentage: 15 },
    { name: "Paid Search", views: 10000, percentage: 10 },
    { name: "Referral", views: 5000, percentage: 5 },
  ],
  referrers: [
    { name: "google.com", views: 32000, percentage: 40 },
    { name: "twitter.com", views: 15000, percentage: 18 },
    { name: "ycombinator.com", views: 8000, percentage: 10 },
    { name: "bing.com", views: 6000, percentage: 7 },
    { name: "duckduckgo.com", views: 4500, percentage: 5 },
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
    { name: "United States", code: "US", flag: "🇺🇸", count: 46000, percentage: 46 },
    { name: "United Kingdom", code: "GB", flag: "🇬🇧", count: 15000, percentage: 15 },
    { name: "Germany", code: "DE", flag: "🇩🇪", count: 13000, percentage: 13 },
    { name: "United Arab Emirates", code: "AE", flag: "🇦🇪", count: 11000, percentage: 11 },
    { name: "Japan", code: "JP", flag: "🇯🇵", count: 8000, percentage: 8 },
  ],
  regions: [
    { name: "California (US)", count: 18000, percentage: 25 },
    { name: "New York (US)", count: 12000, percentage: 18 },
    { name: "England (GB)", count: 9000, percentage: 12 },
    { name: "Bavaria (DE)", count: 5000, percentage: 8 },
    { name: "Dubai (AE)", count: 4500, percentage: 7 },
  ],
  cities: [
    { name: "San Francisco", count: 12000, percentage: 15 },
    { name: "London", count: 8500, percentage: 10 },
    { name: "New York", count: 7000, percentage: 8 },
    { name: "Berlin", count: 5500, percentage: 6 },
    { name: "Dubai", count: 4000, percentage: 5 },
  ]
};

export const mockTech = {
  browsers: [
    { name: "Google Chrome", count: 65000, percentage: 65 },
    { name: "Apple Safari", count: 21000, percentage: 21 },
    { name: "Mozilla Firefox", count: 8000, percentage: 8 },
    { name: "Microsoft Edge", count: 6000, percentage: 6 },
  ],
  os: [
    { name: "macOS", count: 42000, percentage: 42 },
    { name: "Windows", count: 31000, percentage: 31 },
    { name: "iOS", count: 15000, percentage: 15 },
    { name: "Android", count: 10000, percentage: 10 },
    { name: "Linux", count: 2000, percentage: 2 },
  ],
  devices: [
    { name: "Desktop", count: 69000, percentage: 69 },
    { name: "Mobile", count: 26000, percentage: 26 },
    { name: "Tablet", count: 5000, percentage: 5 },
  ]
};
