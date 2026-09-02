"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ExternalLink,
  Users,
  TrendingUp,
  Percent,
  DollarSign,
  Clock,
  Activity,
  Calendar,
  Filter,
  RefreshCcw,
  Loader2,
  KeyRound,
  ArrowRight,
} from "lucide-react";
import { AnalyticsChart } from "@/components/analytics/analytics-chart";
import { InteractiveMap } from "@/components/analytics/interactive-map";

export type MetricType = "visitors" | "revenue" | "conversionRate" | "bounceRate" | "sessionTime";
import { ChannelPieChart } from "@/components/analytics/channel-pie-chart";
import { CustomBarList } from "@/components/analytics/custom-bar-list";
import { FunnelVisualizer } from "@/components/analytics/funnel-visualizer";
import { MilestonesVisualizer } from "@/components/analytics/milestones-visualizer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  websitesApi,
  analyticsApi,
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

export type TimeRangeType = "Today" | "Last 24h" | "7 Days" | "30 Days" | "YTD";

export interface PublicSiteMeta {
  id: string;
  domain: string;
  name: string;
  timezone: string;
  currency: string;
  revenueModel: string;
  isPublic: boolean;
  hasPin: boolean;
}

export interface InitialAnalyticsData {
  onlineCount?: number;
  overview?: OverviewMetrics | null;
  timeseries?: any[];
  sources?: {
    channels?: SourceItem[];
    referrers?: SourceItem[];
    campaigns?: SourceItem[];
  };
  geo?: {
    countries?: CountryItem[];
    regions?: RegionItem[];
    cities?: CityItem[];
    languages?: LanguageItem[];
  };
  devices?: {
    devices?: DeviceItem[];
    os?: DeviceItem[];
    browsers?: DeviceItem[];
    screens?: DeviceItem[];
    loyalty?: { newVisitors: number; returningVisitors: number };
  };
  pages?: PageItem[];
  events?: CustomEventItem[];
}

interface PublicShareClientProps {
  siteMeta: PublicSiteMeta;
  initialAnalytics?: InitialAnalyticsData | null;
}

export function PublicShareClient({
  siteMeta,
  initialAnalytics,
}: PublicShareClientProps) {
  const websiteId = siteMeta.id;

  // Unlocked state initialized immediately from hasPin or sessionStorage
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    if (!siteMeta.hasPin) return true;
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(`analytika_unlocked_${websiteId}`) === "true";
    }
    return false;
  });

  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);

  // Time Range & Metric State (matching main dashboard)
  const [timeRange, setTimeRange] = useState<TimeRangeType>("30 Days");
  const [activeMetric, setActiveMetric] = useState<MetricType>("visitors");
  const [activeFilter, setActiveFilter] = useState("All Traffic");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sub-tabs for the 4 analytics breakdown cards
  const [acqTab, setAcqTab] = useState<"channels" | "referrers" | "campaigns" | "pages">("channels");
  const [techTab, setTechTab] = useState<"browsers" | "os" | "devices" | "screens">("browsers");
  const [geoTab, setGeoTab] = useState<"map" | "countries" | "regions" | "cities" | "languages">("map");
  const [eventTab, setEventTab] = useState<"all" | "actions" | "conversions">("all");
  const [funnelTab, setFunnelTab] = useState<"funnels" | "milestones">("funnels");

  // Analytics Data State (Hydrated from SSR initial props with 0 loading flash)
  const [onlineCount, setOnlineCount] = useState<number>(initialAnalytics?.onlineCount || 0);
  const [overview, setOverview] = useState<OverviewMetrics | null>(initialAnalytics?.overview || null);
  const [timeseries, setTimeseries] = useState<any[]>(initialAnalytics?.timeseries || []);
  const [channels, setChannels] = useState<SourceItem[]>(initialAnalytics?.sources?.channels || []);
  const [referrers, setReferrers] = useState<SourceItem[]>(initialAnalytics?.sources?.referrers || []);
  const [campaigns, setCampaigns] = useState<SourceItem[]>(initialAnalytics?.sources?.campaigns || []);
  const [countries, setCountries] = useState<CountryItem[]>(initialAnalytics?.geo?.countries || []);
  const [regions, setRegions] = useState<RegionItem[]>(initialAnalytics?.geo?.regions || []);
  const [cities, setCities] = useState<CityItem[]>(initialAnalytics?.geo?.cities || []);
  const [languages, setLanguages] = useState<LanguageItem[]>(initialAnalytics?.geo?.languages || []);
  const [devices, setDevices] = useState<DeviceItem[]>(initialAnalytics?.devices?.devices || []);
  const [osList, setOsList] = useState<DeviceItem[]>(initialAnalytics?.devices?.os || []);
  const [browsers, setBrowsers] = useState<DeviceItem[]>(initialAnalytics?.devices?.browsers || []);
  const [screens, setScreens] = useState<DeviceItem[]>(initialAnalytics?.devices?.screens || []);
  const [loyalty, setLoyalty] = useState<{ newVisitors: number; returningVisitors: number } | null>(
    initialAnalytics?.devices?.loyalty || null
  );
  const [pages, setPages] = useState<PageItem[]>(initialAnalytics?.pages || []);
  const [customEvents, setCustomEvents] = useState<CustomEventItem[]>(initialAnalytics?.events || []);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [hasChangedRange, setHasChangedRange] = useState(false);

  // Check sessionStorage on client mount
  useEffect(() => {
    if (!siteMeta.hasPin) return;
    try {
      if (typeof window !== "undefined") {
        const unlocked = sessionStorage.getItem(`analytika_unlocked_${websiteId}`) === "true";
        if (unlocked) setIsUnlocked(true);
      }
    } catch {}
  }, [websiteId, siteMeta.hasPin]);

  // Handle PIN Unlock
  const handleUnlockPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim() || isVerifyingPin) return;
    setIsVerifyingPin(true);
    setPinError(null);

    try {
      const res = await websitesApi.verifyPin(websiteId, pinInput.trim());
      if (res.success && res.verified) {
        setIsUnlocked(true);
        try {
          sessionStorage.setItem(`analytika_unlocked_${websiteId}`, "true");
        } catch {}
      } else {
        setPinError(res.error || "Incorrect PIN code. Please try again.");
      }
    } catch {
      setPinError("Failed to verify PIN code. Please try again.");
    } finally {
      setIsVerifyingPin(false);
    }
  };

  // Live Online Visitors Polling (Every 10 seconds)
  useEffect(() => {
    if (!websiteId || !isUnlocked) return;

    const fetchLive = () => {
      analyticsApi
        .getLive(websiteId)
        .then((res) => {
          if (res.success && typeof res.onlineVisitors === "number") {
            setOnlineCount(res.onlineVisitors);
          }
        })
        .catch(() => {});
    };

    fetchLive();
    const interval = setInterval(fetchLive, 10000);
    return () => clearInterval(interval);
  }, [websiteId, isUnlocked]);

  // Map user-friendly range to backend range key
  const apiRangeKey = useMemo(() => {
    switch (timeRange) {
      case "Today":
        return "today";
      case "Last 24h":
        return "24h";
      case "7 Days":
        return "7d";
      case "YTD":
        return "12m";
      case "30 Days":
      default:
        return "30d";
    }
  }, [timeRange]);

  // Re-fetch data when time range changes on client
  const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
    if (!websiteId || !isUnlocked) return;

    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoadingData(true);

    try {
      const [overviewRes, timeRes, srcRes, geoRes, devRes, pageRes, evtRes] = await Promise.all([
        analyticsApi.getOverview(websiteId, apiRangeKey),
        analyticsApi.getTimeseries(websiteId, apiRangeKey),
        analyticsApi.getSources(websiteId, apiRangeKey),
        analyticsApi.getGeo(websiteId, apiRangeKey),
        analyticsApi.getDevices(websiteId, apiRangeKey),
        analyticsApi.getPages(websiteId, apiRangeKey),
        analyticsApi.getEvents(websiteId, apiRangeKey),
      ]);

      if (overviewRes.success && overviewRes.metrics) setOverview(overviewRes.metrics);
      if (timeRes.success && Array.isArray(timeRes.timeseries)) setTimeseries(timeRes.timeseries);
      if (srcRes.success) {
        setChannels(srcRes.channels || []);
        setReferrers(srcRes.referrers || []);
        setCampaigns(srcRes.campaigns || []);
      }
      if (geoRes.success) {
        setCountries(geoRes.countries || []);
        setRegions(geoRes.regions || []);
        setCities(geoRes.cities || []);
        setLanguages(geoRes.languages || []);
      }
      if (devRes.success) {
        setDevices(devRes.devices || []);
        setOsList(devRes.os || []);
        setBrowsers(devRes.browsers || []);
        setScreens(devRes.screens || []);
        if (devRes.loyalty) setLoyalty(devRes.loyalty);
      }
      if (pageRes.success && Array.isArray(pageRes.pages)) setPages(pageRes.pages);
      if (evtRes.success && Array.isArray(evtRes.events)) setCustomEvents(evtRes.events);
    } catch (err) {
      console.error("Failed to load public analytics data:", err);
    } finally {
      setIsLoadingData(false);
      setIsRefreshing(false);
    }
  }, [websiteId, isUnlocked, apiRangeKey]);

  useEffect(() => {
    if (!hasChangedRange) {
      setHasChangedRange(true);
      return;
    }
    fetchDashboardData();
  }, [apiRangeKey, fetchDashboardData, hasChangedRange]);

  const currencySymbol = useMemo(() => {
    switch (siteMeta.currency) {
      case "EUR":
      case "EUR (€)":
        return "€";
      case "GBP":
      case "GBP (£)":
        return "£";
      case "CAD":
      case "CAD ($)":
        return "CA$";
      case "AUD":
      case "AUD ($)":
        return "A$";
      case "USD":
      case "USD ($)":
      default:
        return "$";
    }
  }, [siteMeta.currency]);

  const revenueLabel = useMemo(() => {
    switch (siteMeta.revenueModel) {
      case "mrr":
        return "MRR";
      case "arr":
        return "ARR";
      case "revenue":
      default:
        return "Revenue";
    }
  }, [siteMeta.revenueModel]);

  // Aggregated totals
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

  // Channels data formatting
  const totalChannelVisitors = channels.reduce((sum, c) => sum + (c.visitors || c.pageviews || 0), 0) || 1;
  const channelPieData = useMemo(() => {
    return channels.map((c) => {
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
  }, [channels, totalChannelVisitors]);

  // Referrers data formatting
  const totalReferrerVisitors = referrers.reduce((sum, r) => sum + r.visitors, 0) || 1;
  const referrerBarData = useMemo(() => {
    return referrers.map((r) => ({
      name: r.name,
      views: r.visitors,
      percentage: Math.round((r.visitors / totalReferrerVisitors) * 100),
      domain: r.name,
    }));
  }, [referrers, totalReferrerVisitors]);

  // Campaigns data formatting
  const totalCampaignVisitors = campaigns.reduce((sum, c) => sum + c.visitors, 0) || 1;
  const campaignBarData = useMemo(() => {
    return campaigns.map((c) => ({
      name: c.name,
      views: c.visitors,
      percentage: Math.round((c.visitors / totalCampaignVisitors) * 100),
    }));
  }, [campaigns, totalCampaignVisitors]);

  // Pages data formatting
  const totalPageViews = pages.reduce((sum, p) => sum + p.pageviews, 0) || 1;
  const pagesBarData = useMemo(() => {
    return pages.map((p) => ({
      name: p.path,
      views: p.pageviews,
      percentage: Math.round((p.pageviews / totalPageViews) * 100),
    }));
  }, [pages, totalPageViews]);

  // Countries data formatting
  const totalCountryVisitors = countries.reduce((sum, c) => sum + c.visitors, 0) || 1;
  const countryBarData = useMemo(() => {
    return countries.map((c) => ({
      name: c.code,
      code: c.code,
      views: c.visitors,
      percentage: Math.round((c.visitors / totalCountryVisitors) * 100),
    }));
  }, [countries, totalCountryVisitors]);

  // Cities data formatting
  const totalCityVisitors = cities.reduce((sum, ci) => sum + ci.visitors, 0) || 1;
  const cityBarData = useMemo(() => {
    return cities.map((ci) => ({
      name: `${ci.name}, ${ci.country}`,
      code: ci.country,
      views: ci.visitors,
      percentage: Math.round((ci.visitors / totalCityVisitors) * 100),
    }));
  }, [cities, totalCityVisitors]);

  // Regions data formatting
  const totalRegionVisitors = regions.reduce((sum, r) => sum + r.visitors, 0) || 1;
  const regionBarData = useMemo(() => {
    return regions.map((r) => ({
      name: `${r.name}, ${r.country}`,
      code: r.country,
      views: r.visitors,
      percentage: Math.round((r.visitors / totalRegionVisitors) * 100),
    }));
  }, [regions, totalRegionVisitors]);

  // Languages data formatting
  const totalLangVisitors = languages.reduce((sum, l) => sum + l.visitors, 0) || 1;
  const languageBarData = useMemo(() => {
    return languages.map((l) => ({
      name: l.name,
      code: l.code.includes("-") ? l.code.split("-")[1] : l.code,
      views: l.visitors,
      percentage: Math.round((l.visitors / totalLangVisitors) * 100),
    }));
  }, [languages, totalLangVisitors]);

  // Tech domains helper
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

  // Browsers data formatting
  const totalBrowserVisitors = browsers.reduce((sum, b) => sum + b.visitors, 0) || 1;
  const browserBarData = useMemo(() => {
    return browsers.map((b) => ({
      name: b.name,
      views: b.visitors,
      percentage: Math.round((b.visitors / totalBrowserVisitors) * 100),
      domain: getTechDomain(b.name),
    }));
  }, [browsers, totalBrowserVisitors]);

  // OS data formatting
  const totalOsVisitors = osList.reduce((sum, o) => sum + o.visitors, 0) || 1;
  const osBarData = useMemo(() => {
    return osList.map((o) => ({
      name: o.name,
      views: o.visitors,
      percentage: Math.round((o.visitors / totalOsVisitors) * 100),
      domain: getTechDomain(o.name),
    }));
  }, [osList, totalOsVisitors]);

  // Devices data formatting
  const totalDeviceVisitors = devices.reduce((sum, d) => sum + d.visitors, 0) || 1;
  const deviceBarData = useMemo(() => {
    return devices.map((d) => ({
      name: d.name === "desktop" ? "Desktop" : d.name === "mobile" ? "Mobile" : d.name === "tablet" ? "Tablet" : d.name,
      views: d.visitors,
      percentage: Math.round((d.visitors / totalDeviceVisitors) * 100),
      lucide: d.name.toLowerCase().includes("mobile") ? "Smartphone" : d.name.toLowerCase().includes("tablet") ? "Tablet" : "Monitor",
    }));
  }, [devices, totalDeviceVisitors]);

  // Screens data formatting
  const totalScreenVisitors = screens.reduce((sum, s) => sum + s.visitors, 0) || 1;
  const screenBarData = useMemo(() => {
    return screens.map((s) => ({
      name: s.name,
      views: s.visitors,
      percentage: Math.round((s.visitors / totalScreenVisitors) * 100),
      lucide: s.name.startsWith("1920") || s.name.startsWith("1440") || s.name.startsWith("2560") ? "Monitor" : "Smartphone",
    }));
  }, [screens, totalScreenVisitors]);

  // Custom Events data formatting
  const totalCustomEventCount = customEvents.reduce((sum, e) => sum + e.totalCount, 0) || 1;
  const customEventBarData = useMemo(() => {
    return customEvents.map((e) => ({
      name: e.name,
      views: e.totalCount,
      percentage: Math.round((e.totalCount / totalCustomEventCount) * 100),
      lucide: "Activity",
    }));
  }, [customEvents, totalCustomEventCount]);

  const actionEvents = useMemo(() => {
    return customEvents.filter((e) => !e.name.toLowerCase().includes("purchase") && e.totalValue === 0);
  }, [customEvents]);

  const actionBarData = useMemo(() => {
    return actionEvents.map((e) => ({
      name: e.name,
      views: e.totalCount,
      percentage: 100,
      lucide: "Activity",
    }));
  }, [actionEvents]);

  const conversionEvents = useMemo(() => {
    return customEvents.filter((e) => e.totalValue > 0 || e.name.toLowerCase().includes("purchase"));
  }, [customEvents]);

  const conversionBarData = useMemo(() => {
    return conversionEvents.map((e) => ({
      name: `${e.name} (${currencySymbol}${e.totalValue.toLocaleString()})`,
      views: e.totalCount,
      percentage: 100,
      lucide: "CreditCard",
    }));
  }, [conversionEvents, currencySymbol]);

  const getEventsData = () => {
    if (eventTab === "actions") return actionBarData;
    if (eventTab === "conversions") return conversionBarData;
    return customEventBarData;
  };

  // PIN Code Protection Gate
  if (siteMeta.hasPin && !isUnlocked) {
    return (
      <main className="min-h-screen bg-[#1F1F1F] text-zinc-100 flex flex-col items-center justify-center p-4 select-none font-sans">
        <div className="w-full max-w-md rounded-2xl bg-[#262626] border border-white/[0.08] p-6 space-y-5 shadow-2xl">
          <div className="flex items-center gap-3 pb-3 border-b border-white/[0.06]">
            <img
              src={`https://www.google.com/s2/favicons?domain=${siteMeta.domain}&sz=64`}
              alt=""
              className="w-6 h-6 rounded-md object-contain bg-[#1F1F1F]"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">{siteMeta.name}</h2>
              <span className="text-[11px] font-mono text-zinc-400">{siteMeta.domain}</span>
            </div>
          </div>

          <div className="space-y-1 text-center">
            <div className="w-10 h-10 rounded-xl bg-[#800E13]/20 border border-[#800E13]/30 text-rose-400 flex items-center justify-center mx-auto mb-2">
              <KeyRound className="w-5 h-5" />
            </div>
            <h1 className="text-base font-bold text-white">PIN Code Protected</h1>
            <p className="text-xs text-zinc-400">
              Please enter the access PIN code to view this public dashboard.
            </p>
          </div>

          <form onSubmit={handleUnlockPin} className="space-y-3">
            <div className="space-y-1.5">
              <Input
                type="password"
                placeholder="Enter PIN code"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                autoFocus
                className="bg-[#1F1F1F] border-white/[0.08] text-white text-center tracking-widest text-sm h-10 font-mono"
              />
              {pinError && (
                <p className="text-[11px] text-rose-400 text-center font-medium">{pinError}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={!pinInput.trim() || isVerifyingPin}
              className="w-full bg-[#800E13] hover:bg-[#9e1218] text-white text-xs font-semibold h-10 rounded-xl cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isVerifyingPin ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Unlock Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </form>
        </div>
      </main>
    );
  }

  // Main Public Analytics Dashboard
  return (
    <div className="min-h-screen bg-[#1F1F1F] text-zinc-100 font-sans pb-20">
      {/* 1. Sticky Public Header Navigation */}
      <header className="sticky top-0 z-40 w-full bg-[#1F1F1F]/90 backdrop-blur-md border-b border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 transition-opacity hover:opacity-90">
            <Image
              src="/logo.svg"
              alt="Analytika Logo"
              width={36}
              height={36}
              className="w-9 h-9 object-contain"
              priority
            />
            <span className="text-xl font-bold tracking-tight text-white">Analytika</span>
          </Link>

          {/* Public Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#262626] border border-white/[0.08] text-xs shadow-sm">
            <img
              src={`https://www.google.com/s2/favicons?domain=${siteMeta.domain}&sz=32`}
              alt=""
              className="w-3.5 h-3.5 rounded-xs object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <span className="font-bold text-white max-w-[140px] truncate">{siteMeta.name}</span>
            <span className="text-zinc-600">|</span>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Public View
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* 1. Header Toolbar (Site Favicon + Range Picker + Filter + Refresh) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
          {/* Left: Domain Identity */}
          <div className="flex items-center gap-3">
            <img
              src={`https://www.google.com/s2/favicons?domain=${siteMeta.domain}&sz=64`}
              alt={siteMeta.domain}
              className="w-7 h-7 object-contain rounded-lg shrink-0 bg-white/10 p-0.5"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white leading-none">
                {siteMeta.domain}
              </h1>
              <a
                href={`https://${siteMeta.domain}`}
                target="_blank"
                rel="noreferrer"
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
                title={`Open https://${siteMeta.domain}`}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
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

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDashboardData(true)}
              title="Refresh Analytics"
              className="h-9 w-9 p-0 bg-[#1F1F1F] border-white/[0.08] hover:border-white/[0.15] hover:bg-[#262626] text-zinc-300 hover:text-white rounded-xl cursor-pointer"
            >
              <RefreshCcw
                className={`h-3.5 w-3.5 transition-transform duration-500 ${
                  isRefreshing ? "animate-spin text-rose-400" : ""
                }`}
              />
            </Button>
          </div>
        </div>

        {/* 2. Chart Card (KPI Ribbon & Main Chart) */}
        <div className="bg-[#262626] border border-white/[0.08] rounded-2xl p-5 space-y-6 shadow-xl">
          {/* KPI Ribbon */}
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
                label: revenueLabel,
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
                type="button"
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

          {/* Main Chart Area */}
          <div className="w-full pt-1 space-y-2">
            {activeMetric === "visitors" && !isLoadingData && (
              <div className="flex items-center justify-between px-1 text-xs font-mono">
                <div className="flex items-center gap-4 text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48]" />
                    <span className="text-zinc-300 font-medium">New Visitors:</span>
                    <span className="text-white font-bold">
                      {loyalty
                        ? `${Math.round(
                            (loyalty.newVisitors /
                              ((loyalty.newVisitors + loyalty.returningVisitors) || 1)) *
                              100
                          )}%`
                        : "0%"}
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                    <span className="text-zinc-300 font-medium">Returning:</span>
                    <span className="text-white font-bold">
                      {loyalty
                        ? `${Math.round(
                            (loyalty.returningVisitors /
                              ((loyalty.newVisitors + loyalty.returningVisitors) || 1)) *
                              100
                          )}%`
                        : "0%"}
                    </span>
                  </span>
                </div>
                <span className="text-[11px] text-zinc-500 hidden sm:inline">
                  Hover graph points to inspect daily distribution
                </span>
              </div>
            )}
            <div className="h-[270px] w-full">
              <AnalyticsChart data={timeseries} activeMetric={activeMetric} />
            </div>
          </div>
        </div>

        {/* 3. Grid of Breakdowns (Row 2: Acquisition & Technology) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Card 1: Acquisition */}
          <div className="bg-[#262626] border border-white/[0.08] rounded-2xl p-5 flex flex-col h-[400px]">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-2">
              <div className="flex items-center gap-1 bg-[#1F1F1F] p-1 rounded-lg border border-white/[0.04] shadow-inner">
                {(["channels", "referrers", "campaigns", "pages"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setAcqTab(tab)}
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
              {acqTab === "channels" && <ChannelPieChart data={channelPieData} />}
              {acqTab === "referrers" && <CustomBarList data={referrerBarData} type="referrer" />}
              {acqTab === "campaigns" && <CustomBarList data={campaignBarData} type="campaign" />}
              {acqTab === "pages" && <CustomBarList data={pagesBarData} type="page" />}
            </div>
          </div>

          {/* Card 2: Technology */}
          <div className="bg-[#262626] border border-white/[0.08] rounded-2xl p-5 flex flex-col h-[400px]">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-2">
              <div className="flex items-center gap-1 bg-[#1F1F1F] p-1 rounded-lg border border-white/[0.04] shadow-inner">
                {(["browsers", "os", "devices", "screens"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
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
              {techTab === "devices" && <CustomBarList data={deviceBarData} type="tech" />}
              {techTab === "os" && <CustomBarList data={osBarData} type="tech" />}
              {techTab === "browsers" && <CustomBarList data={browserBarData} type="tech" />}
              {techTab === "screens" && <CustomBarList data={screenBarData} type="tech" />}
            </div>
          </div>
        </div>

        {/* 4. Grid of Breakdowns (Row 3: Location & Events) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Card 3: Location */}
          <div className="bg-[#262626] border border-white/[0.08] rounded-2xl p-5 flex flex-col h-[400px]">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-2">
              <div className="flex items-center gap-1 bg-[#1F1F1F] p-1 rounded-lg border border-white/[0.04] shadow-inner">
                {(["map", "countries", "regions", "cities", "languages"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
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
              {geoTab === "map" && <InteractiveMap data={countryBarData} />}
              {geoTab === "countries" && <CustomBarList data={countryBarData} type="location" />}
              {geoTab === "regions" && <CustomBarList data={regionBarData} type="location" />}
              {geoTab === "cities" && <CustomBarList data={cityBarData} type="location" />}
              {geoTab === "languages" && <CustomBarList data={languageBarData} type="location" />}
            </div>
          </div>

          {/* Card 4: Events */}
          <div className="bg-[#262626] border border-white/[0.08] rounded-2xl p-5 flex flex-col h-[400px]">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-2">
              <div className="flex items-center gap-1 bg-[#1F1F1F] p-1 rounded-lg border border-white/[0.04] shadow-inner">
                {(["all", "actions", "conversions"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
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
              <span className="text-xs font-mono text-zinc-500 pr-1">
                {getEventsData().reduce((acc, curr) => acc + curr.views, 0).toLocaleString()} events
              </span>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden min-h-0 pr-2">
              <CustomBarList data={getEventsData()} type="event" />
            </div>
          </div>
        </div>

        {/* 5. Row 4: Full Width (Funnels & Milestones) */}
        <div className="w-full bg-[#262626] border border-white/[0.08] rounded-2xl p-4 sm:p-5 flex flex-col min-h-[480px]">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-2">
            <div className="flex items-center gap-1 bg-[#1F1F1F] p-1 rounded-lg border border-white/[0.04] shadow-inner">
              <button
                type="button"
                onClick={() => setFunnelTab("funnels")}
                className={`text-[13px] font-medium transition-all px-3.5 py-1.5 rounded-md cursor-pointer ${
                  funnelTab === "funnels"
                    ? "bg-[#262626] text-white shadow-sm border border-white/[0.08]"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Conversion Funnels
              </button>
              <button
                type="button"
                onClick={() => setFunnelTab("milestones")}
                className={`text-[13px] font-medium transition-all px-3.5 py-1.5 rounded-md cursor-pointer ${
                  funnelTab === "milestones"
                    ? "bg-[#262626] text-white shadow-sm border border-white/[0.08]"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Target Milestones
              </button>
            </div>
          </div>

          {funnelTab === "funnels" && (
            <FunnelVisualizer websiteId={websiteId} timeRange={apiRangeKey} readOnly={true} />
          )}
          {funnelTab === "milestones" && (
            <MilestonesVisualizer websiteId={websiteId} timeRange={apiRangeKey} readOnly={true} />
          )}
        </div>
      </main>
    </div>
  );
}
