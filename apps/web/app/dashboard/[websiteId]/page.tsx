"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Users,
  TrendingUp,
  Percent,
  DollarSign,
  Settings,
  Calendar,
  Filter,
  RefreshCcw,
  Clock,
  Activity,
  Share2,
} from "lucide-react";
import { AnalyticsChart } from "@/components/analytics/analytics-chart";
import { InteractiveMap } from "@/components/analytics/interactive-map";
import { ChannelPieChart } from "@/components/analytics/channel-pie-chart";
import { CustomBarList } from "@/components/analytics/custom-bar-list";
import { FunnelVisualizer } from "@/components/analytics/funnel-visualizer";
import { MilestonesVisualizer } from "@/components/analytics/milestones-visualizer";
import { ShareWidgetModal } from "@/components/analytics/share-widget-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  websitesApi,
  analyticsApi,
  Website,
  OverviewMetrics,
  SourceItem,
  CountryItem,
  RegionItem,
  CityItem,
  LanguageItem,
  DeviceItem,
  PageItem,
  CustomEventItem,
} from "@/lib/api";
import { getCurrencySymbol } from "@/lib/utils";

type MetricType = "visitors" | "revenue" | "conversionRate" | "bounceRate" | "sessionTime";
type TimeRangeType = "Today" | "Last 24h" | "7 Days" | "30 Days" | "YTD";

function SkeletonBarList() {
  return (
    <div className="w-full h-full flex flex-col justify-around py-2 animate-pulse select-none">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-white/[0.05]" />
              <div className="w-28 h-3.5 rounded bg-white/[0.04]" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-3.5 rounded bg-white/[0.05]" />
              <div className="w-6 h-3 rounded bg-white/[0.03]" />
            </div>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/[0.03]" />
        </div>
      ))}
    </div>
  );
}

function SkeletonMap() {
  return (
    <div className="w-full h-full flex items-center justify-center p-4 animate-pulse select-none">
      <div className="w-full h-[220px] rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center" />
    </div>
  );
}

export default function WebsiteAnalyticsPage() {
  const params = useParams();
  const websiteId = (params.websiteId as string) || "1";

  // Website details
  const [site, setSite] = useState<Website | null>(null);

  // State
  const [timeRange, setTimeRange] = useState<TimeRangeType>("30 Days");
  const [activeMetric, setActiveMetric] = useState<MetricType>("visitors");
  const [activeFilter, setActiveFilter] = useState("All Traffic");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);

  // Sub-tabs for card groups
  const [acqTab, setAcqTab] = useState<"channels" | "referrers" | "campaigns" | "pages">("channels");
  const [geoTab, setGeoTab] = useState<"map" | "countries" | "regions" | "cities" | "languages">("map");
  const [techTab, setTechTab] = useState<"browsers" | "os" | "devices" | "screens">("browsers");
  const [eventTab, setEventTab] = useState<"all" | "actions" | "conversions">("all");
  const [funnelTab, setFunnelTab] = useState<"funnels" | "milestones">("funnels");

  // Real Analytics Data State
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [realTimeseries, setRealTimeseries] = useState<any[] | null>(null);
  const [channels, setChannels] = useState<SourceItem[]>([]);
  const [referrers, setReferrers] = useState<SourceItem[]>([]);
  const [campaigns, setCampaigns] = useState<SourceItem[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [regions, setRegions] = useState<RegionItem[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [languages, setLanguages] = useState<LanguageItem[]>([]);
  const [browsers, setBrowsers] = useState<DeviceItem[]>([]);
  const [osList, setOsList] = useState<DeviceItem[]>([]);
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [screens, setScreens] = useState<DeviceItem[]>([]);
  const [loyalty, setLoyalty] = useState<{ newVisitors: number; returningVisitors: number } | null>(null);
  const [customEvents, setCustomEvents] = useState<CustomEventItem[]>([]);

  // 1. Fetch Website Details
  useEffect(() => {
    if (!websiteId) return;
    websitesApi.get(websiteId).then((res) => {
      if (res.success && res.website) {
        setSite(res.website);
      }
    }).catch(() => {});
  }, [websiteId]);

  // 2. Fetch Live Online Visitors (Polling every 10s)
  useEffect(() => {
    if (!websiteId) return;
    const fetchLive = () => {
      analyticsApi.getLive(websiteId).then((res) => {
        if (res.success && typeof res.onlineVisitors === "number") {
          setOnlineCount(res.onlineVisitors);
        }
      }).catch(() => {});
    };
    fetchLive();
    const interval = setInterval(fetchLive, 10000);
    return () => clearInterval(interval);
  }, [websiteId]);

  const getRangeParam = (r: TimeRangeType): string => {
    switch (r) {
      case "Today": return "today";
      case "Last 24h": return "24h";
      case "7 Days": return "7d";
      case "30 Days": return "30d";
      case "YTD": return "12m";
      default: return "30d";
    }
  };

  // 3. Load Main Analytics Data
  const loadAnalytics = useCallback(async (isRefresh = false) => {
    if (!websiteId) return;
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    const rangeParam = getRangeParam(timeRange);

    try {
      const [
        overviewRes,
        timeseriesRes,
        sourcesRes,
        pagesRes,
        geoRes,
        devicesRes,
        eventsRes,
      ] = await Promise.all([
        analyticsApi.getOverview(websiteId, rangeParam),
        analyticsApi.getTimeseries(websiteId, rangeParam),
        analyticsApi.getSources(websiteId, rangeParam),
        analyticsApi.getPages(websiteId, rangeParam),
        analyticsApi.getGeo(websiteId, rangeParam),
        analyticsApi.getDevices(websiteId, rangeParam),
        analyticsApi.getEvents(websiteId, rangeParam),
      ]);

      if (overviewRes.success && overviewRes.metrics) {
        setOverview(overviewRes.metrics);
      } else {
        setOverview(null);
      }

      if (timeseriesRes.success && timeseriesRes.timeseries && timeseriesRes.timeseries.length > 0) {
        const formatted = timeseriesRes.timeseries.map((pt) => {
          let label = pt.date;
          try {
            const d = new Date(pt.date);
            if (timeseriesRes.interval === "hour") {
              label = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            } else if (timeseriesRes.interval === "day") {
              label = d.toLocaleDateString([], { month: "short", day: "numeric" });
            } else {
              label = d.toLocaleDateString([], { month: "short", year: "2-digit" });
            }
          } catch {}

          return {
            date: pt.date,
            label,
            visitors: pt.visitors,
            pageviews: pt.pageviews,
            revenue: pt.revenue,
            conversionRate: pt.visitors > 0 ? Math.min(100, ((overviewRes.metrics?.purchases || 0) / pt.visitors) * 100) : 0,
            bounceRate: overviewRes.metrics?.bounceRate || 0,
            sessionTime: overviewRes.metrics?.avgSessionDurationSeconds || 0,
          };
        });
        setRealTimeseries(formatted);
      } else {
        setRealTimeseries([]);
      }

      if (sourcesRes.success) {
        setChannels(sourcesRes.channels || []);
        setReferrers(sourcesRes.referrers || []);
        setCampaigns(sourcesRes.campaigns || []);
      } else {
        setChannels([]);
        setReferrers([]);
        setCampaigns([]);
      }

      if (pagesRes.success && pagesRes.pages) {
        setPages(pagesRes.pages);
      } else {
        setPages([]);
      }

      if (geoRes.success) {
        setCountries(geoRes.countries || []);
        setRegions(geoRes.regions || []);
        setCities(geoRes.cities || []);
        setLanguages(geoRes.languages || []);
      } else {
        setCountries([]);
        setRegions([]);
        setCities([]);
        setLanguages([]);
      }

      if (devicesRes.success) {
        setBrowsers(devicesRes.browsers || []);
        setOsList(devicesRes.os || []);
        setDevices(devicesRes.devices || []);
        setScreens(devicesRes.screens || []);
        if (devicesRes.loyalty) {
          setLoyalty(devicesRes.loyalty);
        }
      } else {
        setBrowsers([]);
        setOsList([]);
        setDevices([]);
        setScreens([]);
      }

      if (eventsRes.success && eventsRes.events) {
        setCustomEvents(eventsRes.events);
      } else {
        setCustomEvents([]);
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [websiteId, timeRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Domain Identity & Currency
  const siteDomain = site?.domain || "";
  const siteCurrency = site?.currency || "USD";
  const currencySymbol = getCurrencySymbol(siteCurrency);

  // Timeseries & Aggregates strictly from real data
  const timeseries = realTimeseries || [];

  const totals = useMemo(() => {
    if (overview) {
      return {
        visitors: overview.visitors || 0,
        revenue: overview.revenue || 0,
        avgBounce: overview.bounceRate || 0,
        avgSession: overview.avgSessionDurationSeconds || 0,
        avgConv: overview.visitors > 0 ? ((overview.purchases || 0) / overview.visitors) * 100 : 0,
      };
    }

    const visitors = timeseries.reduce((acc, curr) => acc + curr.visitors, 0);
    const revenue = timeseries.reduce((acc, curr) => acc + curr.revenue, 0);
    const avgBounce = timeseries.length > 0 ? timeseries.reduce((acc, curr) => acc + curr.bounceRate, 0) / timeseries.length : 0;
    const avgSession = timeseries.length > 0 ? timeseries.reduce((acc, curr) => acc + curr.sessionTime, 0) / timeseries.length : 0;
    const avgConv = timeseries.length > 0 ? timeseries.reduce((acc, curr) => acc + curr.conversionRate, 0) / timeseries.length : 0;

    return { visitors, revenue, avgBounce, avgSession, avgConv };
  }, [overview, timeseries]);

  // Channels data
  const totalChannelVisitors = channels.reduce((sum, c) => sum + (c.visitors || c.pageviews || 0), 0) || 1;
  const channelPieData = channels.map((c) => {
    const val = c.visitors || c.pageviews || 0;
    return {
      name: c.name || "Direct",
      views: val,
      percentage: Math.round((val / totalChannelVisitors) * 100),
      domain: c.name.toLowerCase().includes("google")
        ? "google.com"
        : c.name.toLowerCase().includes("twitter")
        ? "twitter.com"
        : null,
    };
  });

  // Referrers data
  const totalReferrerVisitors = referrers.reduce((sum, r) => sum + r.visitors, 0) || 1;
  const referrerBarData = referrers.map((r) => ({
    name: r.name,
    views: r.visitors,
    percentage: Math.round((r.visitors / totalReferrerVisitors) * 100),
    domain: r.name,
  }));

  // Campaigns data
  const totalCampaignVisitors = campaigns.reduce((sum, c) => sum + c.visitors, 0) || 1;
  const campaignBarData = campaigns.map((c) => ({
    name: c.name,
    views: c.visitors,
    percentage: Math.round((c.visitors / totalCampaignVisitors) * 100),
  }));

  // Pages data
  const totalPageViews = pages.reduce((sum, p) => sum + p.pageviews, 0) || 1;
  const pagesBarData = pages.map((p) => ({
    name: p.path,
    views: p.pageviews,
    percentage: Math.round((p.pageviews / totalPageViews) * 100),
  }));

  // Countries data
  const totalCountryVisitors = countries.reduce((sum, c) => sum + c.visitors, 0) || 1;
  const countryBarData = countries.map((c) => ({
    name: c.code,
    code: c.code,
    views: c.visitors,
    percentage: Math.round((c.visitors / totalCountryVisitors) * 100),
  }));

  // Cities data
  const totalCityVisitors = cities.reduce((sum, ci) => sum + ci.visitors, 0) || 1;
  const cityBarData = cities.map((ci) => ({
    name: `${ci.name}, ${ci.country}`,
    code: ci.country,
    views: ci.visitors,
    percentage: Math.round((ci.visitors / totalCityVisitors) * 100),
  }));

  // Regions data
  const totalRegionVisitors = regions.reduce((sum, r) => sum + r.visitors, 0) || 1;
  const regionBarData = regions.map((r) => ({
    name: `${r.name}, ${r.country}`,
    code: r.country,
    views: r.visitors,
    percentage: Math.round((r.visitors / totalRegionVisitors) * 100),
  }));

  // Languages data
  const totalLangVisitors = languages.reduce((sum, l) => sum + l.visitors, 0) || 1;
  const languageBarData = languages.map((l) => ({
    name: l.name,
    code: l.code.includes("-") ? l.code.split("-")[1] : l.code,
    views: l.visitors,
    percentage: Math.round((l.visitors / totalLangVisitors) * 100),
  }));

  // Helper for tech brand domains
  const getTechDomain = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes("chrome")) return "chrome.com";
    if (n.includes("safari")) return "apple.com";
    if (n.includes("firefox")) return "firefox.com";
    if (n.includes("edge")) return "microsoft.com";
    if (n.includes("brave")) return "brave.com";
    if (n.includes("arc")) return "arc.net";
    if (n.includes("opera")) return "opera.com";
    if (n.includes("windows")) return "microsoft.com";
    if (n.includes("mac") || n.includes("ios")) return "apple.com";
    if (n.includes("android")) return "android.com";
    if (n.includes("linux")) return "ubuntu.com";
    return "google.com";
  };

  // Browsers data
  const totalBrowserVisitors = browsers.reduce((sum, b) => sum + b.visitors, 0) || 1;
  const browserBarData = browsers.map((b) => ({
    name: b.name,
    views: b.visitors,
    percentage: Math.round((b.visitors / totalBrowserVisitors) * 100),
    domain: getTechDomain(b.name),
  }));

  // OS data
  const totalOsVisitors = osList.reduce((sum, o) => sum + o.visitors, 0) || 1;
  const osBarData = osList.map((o) => ({
    name: o.name,
    views: o.visitors,
    percentage: Math.round((o.visitors / totalOsVisitors) * 100),
    domain: getTechDomain(o.name),
  }));

  // Devices data
  const totalDeviceVisitors = devices.reduce((sum, d) => sum + d.visitors, 0) || 1;
  const deviceBarData = devices.map((d) => ({
    name: d.name === "desktop" ? "Desktop" : d.name === "mobile" ? "Mobile" : d.name === "tablet" ? "Tablet" : d.name,
    views: d.visitors,
    percentage: Math.round((d.visitors / totalDeviceVisitors) * 100),
    lucide: d.name.toLowerCase().includes("mobile") ? "Smartphone" : d.name.toLowerCase().includes("tablet") ? "Tablet" : "Monitor",
  }));

  // Screens data
  const totalScreenVisitors = screens.reduce((sum, s) => sum + s.visitors, 0) || 1;
  const screenBarData = screens.map((s) => ({
    name: s.name,
    views: s.visitors,
    percentage: Math.round((s.visitors / totalScreenVisitors) * 100),
    lucide: s.name.startsWith("1920") || s.name.startsWith("1440") || s.name.startsWith("2560") ? "Monitor" : "Smartphone",
  }));

  // Loyalty / Visitors data (New vs Returning)
  const totalLoyaltyVisitors = (loyalty ? loyalty.newVisitors + loyalty.returningVisitors : 0) || 1;
  const loyaltyBarData = loyalty && (loyalty.newVisitors > 0 || loyalty.returningVisitors > 0) ? [
    {
      name: "New Visitors",
      views: loyalty.newVisitors,
      percentage: Math.round((loyalty.newVisitors / totalLoyaltyVisitors) * 100),
      lucide: "Sparkles",
    },
    {
      name: "Returning Visitors",
      views: loyalty.returningVisitors,
      percentage: Math.round((loyalty.returningVisitors / totalLoyaltyVisitors) * 100),
      lucide: "RotateCcw",
    },
  ] : [];

  // Custom Events data
  const totalCustomEventCount = customEvents.reduce((sum, e) => sum + e.totalCount, 0) || 1;
  const customEventBarData = customEvents.map((e) => ({
    name: e.name,
    views: e.totalCount,
    percentage: Math.round((e.totalCount / totalCustomEventCount) * 100),
    lucide: "Activity",
  }));

  const actionEvents = customEvents.filter((e) => !e.name.toLowerCase().includes("purchase") && e.totalValue === 0);
  const actionBarData = actionEvents.map((e) => ({
    name: e.name,
    views: e.totalCount,
    percentage: 100,
    lucide: "Activity",
  }));

  const conversionEvents = customEvents.filter((e) => e.totalValue > 0 || e.name.toLowerCase().includes("purchase"));
  const conversionBarData = conversionEvents.map((e) => ({
    name: `${e.name} (${currencySymbol}${e.totalValue.toLocaleString()})`,
    views: e.totalCount,
    percentage: 100,
    lucide: "CreditCard",
  }));

  const getEventsData = () => {
    if (eventTab === "actions") return actionBarData;
    if (eventTab === "conversions") return conversionBarData;
    return customEventBarData;
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        {/* Left: Identity */}
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0 bg-[#1F1F1F] border-white/[0.08] hover:bg-[#262626] hover:border-white/[0.15] text-zinc-400 hover:text-white rounded-xl cursor-pointer shrink-0"
            title="Back to websites"
          >
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          {siteDomain ? (
            <>
              <img
                src={`https://www.google.com/s2/favicons?domain=${siteDomain}&sz=64`}
                alt={siteDomain}
                className="w-7 h-7 object-contain rounded-lg shrink-0 bg-white/10 p-0.5"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white leading-none">
                  {siteDomain}
                </h1>
                <a
                  href={`https://${siteDomain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-zinc-500 hover:text-zinc-300 transition-colors"
                  title={`Open https://${siteDomain}`}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2.5 animate-pulse select-none">
              <div className="w-7 h-7 rounded-lg bg-white/[0.06] shrink-0" />
              <div className="w-28 h-5 rounded bg-white/[0.06]" />
            </div>
          )}
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Date Range Picker */}
          <div className="w-[145px]">
            <Select
              value={timeRange}
              onValueChange={(val) => setTimeRange(val as TimeRangeType)}
            >
              <SelectTrigger className="bg-[#1F1F1F] border-white/[0.08] hover:border-white/[0.15] text-zinc-300 font-mono text-xs h-9 rounded-xl">
                <div className="flex items-center gap-2 truncate">
                  <Calendar className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <span className="truncate">{timeRange}</span>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-[#1F1F1F] border-white/[0.08] text-zinc-200">
                {(["Today", "Last 24h", "7 Days", "30 Days", "YTD"] as TimeRangeType[]).map(
                  (r) => (
                    <SelectItem key={r} value={r} className="text-xs cursor-pointer">
                      {r}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Filter Dropdown */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`bg-[#1F1F1F] border-white/[0.08] hover:border-white/[0.15] hover:bg-[#262626] text-xs font-mono h-9 px-3 rounded-xl cursor-pointer ${
                  activeFilter !== "All Traffic"
                    ? "text-rose-400 border-rose-500/30"
                    : "text-zinc-300"
                }`}
              >
                <Filter className="h-3.5 w-3.5 mr-1.5 text-zinc-400" />
                <span>{activeFilter}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-44 bg-[#1F1F1F] border-white/[0.08] text-zinc-300 text-xs"
            >
              <DropdownMenuLabel className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 px-2 py-1">
                Filter Traffic
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/[0.06]" />
              {[
                "All Traffic",
                "Direct Traffic",
                "Organic Search",
                "Paid Campaigns",
                "Desktop Only",
                "Mobile Only",
              ].map((f) => (
                <DropdownMenuItem
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`text-xs cursor-pointer hover:bg-white/[0.04] hover:text-white ${
                    activeFilter === f ? "text-white font-semibold bg-white/[0.06]" : ""
                  }`}
                >
                  {f}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Share & Embed Widget Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsShareOpen(true)}
            title="Share & Embed Analytics Widget"
            className="bg-[#1F1F1F] border-white/[0.08] hover:border-white/[0.15] hover:bg-[#262626] text-zinc-300 hover:text-white h-9 px-3 rounded-xl text-xs font-mono transition-all cursor-pointer shadow-xs"
          >
            <Share2 className="h-3.5 w-3.5 mr-1.5 text-rose-400" />
            <span className="hidden sm:inline">Share</span>
          </Button>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadAnalytics(true)}
            title="Refresh Analytics"
            className="h-9 w-9 p-0 bg-[#1F1F1F] border-white/[0.08] hover:border-white/[0.15] hover:bg-[#262626] text-zinc-300 hover:text-white rounded-xl cursor-pointer"
          >
            <RefreshCcw
              className={`h-3.5 w-3.5 transition-transform duration-500 ${
                isRefreshing ? "animate-spin text-rose-400" : ""
              }`}
            />
          </Button>

          {/* Settings Button */}
          <Button
            asChild
            variant="outline"
            size="sm"
            title="Website Settings"
            className="h-9 w-9 p-0 bg-[#1F1F1F] border-white/[0.08] hover:border-white/[0.15] hover:bg-[#262626] text-zinc-400 hover:text-white rounded-xl cursor-pointer"
          >
            <Link href={`/dashboard/${websiteId}/settings`}>
              <Settings className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Chart Card (KPI Ribbon & Main Chart) */}
      <div className="bg-[#262626] border border-white/[0.08] rounded-2xl p-5 space-y-6 shadow-xl">
        {/* KPI Ribbon */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-3.5 rounded-xl border bg-[#1F1F1F] border-white/[0.04] flex flex-col justify-between h-[76px]">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-3 rounded bg-white/[0.05]" />
                  <div className="w-3.5 h-3.5 rounded bg-white/[0.04]" />
                </div>
                <div className="w-20 h-6 rounded bg-white/[0.08]" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              {
                id: "visitors",
                label: "Visitors",
                val: totals.visitors.toLocaleString(),
                icon: Users,
              },
              {
                id: "revenue",
                label: site?.revenueModel === "mrr" ? "MRR" : site?.revenueModel === "arr" ? "ARR" : "Revenue",
                val: `${currencySymbol}${totals.revenue.toLocaleString()}`,
                icon: DollarSign,
              },
              {
                id: "conversionRate",
                label: "Conv. Rate",
                val: `${totals.avgConv.toFixed(1)}%`,
                icon: TrendingUp,
              },
              {
                id: "bounceRate",
                label: "Bounce Rate",
                val: `${totals.avgBounce.toFixed(1)}%`,
                icon: Percent,
              },
              {
                id: "sessionTime",
                label: "Session Time",
                val: `${Math.floor(totals.avgSession / 60)}m ${Math.floor(
                  totals.avgSession % 60
                )}s`,
                icon: Clock,
              },
            ].map((metric) => (
              <button
                key={metric.id}
                onClick={() => setActiveMetric(metric.id as MetricType)}
                className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
                  activeMetric === metric.id
                    ? "bg-[#2A2A2A] border-[#800E13] ring-1 ring-[#800E13]/50 shadow-lg shadow-[#800E13]/10"
                    : "bg-[#1F1F1F] border-white/[0.04] hover:border-white/[0.1]"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1.5">
                  <span>{metric.label}</span>
                  <metric.icon
                    className={`h-3.5 w-3.5 ${
                      activeMetric === metric.id ? "text-rose-400" : "text-zinc-500"
                    }`}
                  />
                </div>
                <div className="text-xl font-bold font-mono text-white tracking-tight">
                  {metric.val}
                </div>
              </button>
            ))}

            {/* Live Online Indicator */}
            <div className="p-3.5 rounded-xl text-left border bg-[#1F1F1F] border-white/[0.04]">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1.5">
                <span>Online Now</span>
                <Activity className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                </span>
                <div className="text-xl font-bold font-mono text-white tracking-tight">
                  {onlineCount}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Chart Area */}
        <div className="w-full pt-1 space-y-2">
          {activeMetric === "visitors" && !isLoading && (
            <div className="flex items-center justify-between px-1 text-xs font-mono">
              <div className="flex items-center gap-4 text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48]" />
                  <span className="text-zinc-300 font-medium">New Visitors:</span>
                  <span className="text-white font-bold">{loyalty ? `${Math.round((loyalty.newVisitors / ((loyalty.newVisitors + loyalty.returningVisitors) || 1)) * 100)}%` : "0%"}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                  <span className="text-zinc-300 font-medium">Returning:</span>
                  <span className="text-white font-bold">{loyalty ? `${Math.round((loyalty.returningVisitors / ((loyalty.newVisitors + loyalty.returningVisitors) || 1)) * 100)}%` : "0%"}</span>
                </span>
              </div>
              <span className="text-[11px] text-zinc-500 hidden sm:inline">Hover graph points to inspect daily distribution</span>
            </div>
          )}
          <div className="h-[270px] w-full">
            {isLoading ? (
              <div className="w-full h-full rounded-xl bg-[#141414]/60 border border-white/[0.03] flex items-end justify-between px-6 py-4 gap-3 animate-pulse">
                {[40, 65, 30, 80, 55, 90, 45, 70, 85, 60, 95, 75].map((h, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-white/[0.03] rounded-t-md"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            ) : (
              <AnalyticsChart data={timeseries} activeMetric={activeMetric} />
            )}
          </div>
        </div>
      </div>

      {/* 3. Grid of Charts (Breakdowns) */}
      <div className="flex flex-col gap-5">
        {/* Row 2: 2 Columns (Acquisition & Technology) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Card 1: Acquisition */}
          <div className="bg-[#262626] border border-white/[0.08] rounded-2xl p-5 flex flex-col h-[400px]">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-2">
              <div className="flex items-center gap-1 bg-[#1F1F1F] p-1 rounded-lg border border-white/[0.04] shadow-inner">
                {["channels", "referrers", "campaigns", "pages"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setAcqTab(tab as any)}
                    className={`text-[13px] font-medium capitalize transition-all px-3 py-1.5 rounded-md cursor-pointer ${
                      acqTab === tab
                        ? "bg-[#262626] text-white shadow-sm border border-white/[0.08]"
                        : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden min-h-0 pr-2">
              {isLoading ? (
                <SkeletonBarList />
              ) : (
                <>
                  {acqTab === "channels" && <ChannelPieChart data={channelPieData as any} />}
                  {acqTab === "referrers" && <CustomBarList data={referrerBarData} type="referrer" />}
                  {acqTab === "campaigns" && <CustomBarList data={campaignBarData} type="campaign" />}
                  {acqTab === "pages" && <CustomBarList data={pagesBarData} type="page" />}
                </>
              )}
            </div>
          </div>

          {/* Card 2: Technology */}
          <div className="bg-[#262626] border border-white/[0.08] rounded-2xl p-5 flex flex-col h-[400px]">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-2">
              <div className="flex items-center gap-1 bg-[#1F1F1F] p-1 rounded-lg border border-white/[0.04] shadow-inner">
                {(["browsers", "os", "devices", "screens"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setTechTab(tab)}
                    className={`text-[13px] font-medium capitalize transition-all px-3 py-1.5 rounded-md cursor-pointer ${
                      techTab === tab
                        ? "bg-[#262626] text-white shadow-sm border border-white/[0.08]"
                        : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                    }`}
                  >
                    {tab === "os" ? "OS" : tab}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden min-h-0 pr-2">
              {isLoading ? (
                <SkeletonBarList />
              ) : (
                <>
                  {techTab === "browsers" && <CustomBarList data={browserBarData} type="tech" />}
                  {techTab === "os" && <CustomBarList data={osBarData} type="tech" />}
                  {techTab === "devices" && <CustomBarList data={deviceBarData as any} type="tech" />}
                  {techTab === "screens" && <CustomBarList data={screenBarData} type="tech" />}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Row 3: 2 Columns (Location & Events) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Card 3: Location */}
          <div className="bg-[#262626] border border-white/[0.08] rounded-2xl p-5 flex flex-col h-[400px]">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-2">
              <div className="flex items-center gap-1 bg-[#1F1F1F] p-1 rounded-lg border border-white/[0.04] shadow-inner">
                {(["map", "countries", "regions", "cities", "languages"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setGeoTab(tab)}
                    className={`text-[13px] font-medium capitalize transition-all px-3 py-1.5 rounded-md cursor-pointer ${
                      geoTab === tab
                        ? "bg-[#262626] text-white shadow-sm border border-white/[0.08]"
                        : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden min-h-0 pr-2">
              {isLoading ? (
                geoTab === "map" ? <SkeletonMap /> : <SkeletonBarList />
              ) : (
                <>
                  {geoTab === "map" && <InteractiveMap data={countryBarData as any} />}
                  {geoTab === "countries" && <CustomBarList data={countryBarData} type="location" />}
                  {geoTab === "regions" && <CustomBarList data={regionBarData} type="location" />}
                  {geoTab === "cities" && <CustomBarList data={cityBarData} type="location" />}
                  {geoTab === "languages" && <CustomBarList data={languageBarData} type="location" />}
                </>
              )}
            </div>
          </div>

          {/* Card 4: Events */}
          <div className="bg-[#262626] border border-white/[0.08] rounded-2xl p-5 flex flex-col h-[400px]">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-2">
              <div className="flex items-center gap-1 bg-[#1F1F1F] p-1 rounded-lg border border-white/[0.04] shadow-inner">
                {(["all", "actions", "conversions"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setEventTab(tab)}
                    className={`text-[13px] font-medium capitalize transition-all px-3 py-1.5 rounded-md cursor-pointer ${
                      eventTab === tab
                        ? "bg-[#262626] text-white shadow-sm border border-white/[0.08]"
                        : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              {!isLoading && (
                <span className="text-xs font-mono text-zinc-500 pr-1">
                  {getEventsData().reduce((acc, curr) => acc + curr.views, 0).toLocaleString()} events
                </span>
              )}
            </div>
            <div className="flex-1 flex flex-col overflow-hidden min-h-0 pr-2">
              {isLoading ? (
                <SkeletonBarList />
              ) : (
                <CustomBarList data={getEventsData()} type="event" />
              )}
            </div>
          </div>
        </div>

        {/* Row 4: Full Width (Funnels & Milestones) */}
        <div className="w-full bg-[#262626] border border-white/[0.08] rounded-2xl p-4 sm:p-5 flex flex-col min-h-[480px]">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-2">
            <div className="flex items-center gap-1 bg-[#1F1F1F] p-1 rounded-lg border border-white/[0.04] shadow-inner">
              {(["funnels", "milestones"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFunnelTab(tab)}
                  className={`text-[13px] font-medium capitalize transition-all px-3 py-1.5 rounded-md cursor-pointer ${
                    funnelTab === tab
                      ? "bg-[#262626] text-white shadow-sm border border-white/[0.08]"
                      : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 flex flex-col overflow-hidden min-h-0 pt-1">
            {funnelTab === "funnels" && (
              <FunnelVisualizer
                websiteId={websiteId}
                timeRange={timeRange === "Today" ? "today" : timeRange === "Last 24h" ? "24h" : timeRange === "7 Days" ? "7d" : "30d"}
              />
            )}
            {funnelTab === "milestones" && (
              <MilestonesVisualizer
                websiteId={websiteId}
                timeRange={timeRange === "Today" ? "today" : timeRange === "Last 24h" ? "24h" : timeRange === "7 Days" ? "7d" : "30d"}
              />
            )}
          </div>
        </div>
      </div>

      {/* Share & Embed Widget Modal */}
      <ShareWidgetModal
        isOpen={isShareOpen}
        onOpenChange={setIsShareOpen}
        siteDomain={siteDomain}
        websiteId={websiteId}
        onlineCount={onlineCount}
      />
    </div>
  );
}
