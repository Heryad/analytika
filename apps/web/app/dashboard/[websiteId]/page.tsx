"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Users,
  Eye,
  TrendingUp,
  Percent,
  DollarSign,
  Laptop,
  Smartphone,
  Tablet,
  Compass,
  FileText,
  Search,
  Settings,
  Calendar,
  Layers,
  ChevronDown,
  Monitor,
  Filter,
  RefreshCcw,
  Clock,
  Activity,
  MapPin,
  Map,
  Share2
} from "lucide-react";
import { AnalyticsChart } from "@/components/analytics/analytics-chart";
import { InteractiveMap } from "@/components/analytics/interactive-map";
import { ChannelPieChart } from "@/components/analytics/channel-pie-chart";
import { CustomBarList } from "@/components/analytics/custom-bar-list";
import { FunnelVisualizer } from "@/components/analytics/funnel-visualizer";
import { ShareWidgetModal } from "@/components/analytics/share-widget-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateRealisticMetrics, mockAcquisition, mockLocation, mockTech, mockFunnels, mockGoals, mockEvents } from "@/lib/mock-data";

type MetricType = "visitors" | "revenue" | "conversionRate" | "bounceRate" | "sessionTime";
type TimeRangeType = "Today" | "Last 24h" | "7 Days" | "30 Days" | "YTD" | "Custom...";

export default function WebsiteAnalyticsPage() {
  const params = useParams();
  const websiteId = (params.websiteId as string) || "1";

  // Identity
  const siteDomain = websiteId === "1" ? "analytika.dev" : websiteId === "2" ? "saasgrowth.io" : "devpulse.com";
  const siteName = websiteId === "1" ? "Analytika Production" : websiteId === "2" ? "SaaS Growth Hub" : "DevPulse App";

  // State
  const [timeRange, setTimeRange] = useState<TimeRangeType>("30 Days");
  const [activeMetric, setActiveMetric] = useState<MetricType>("visitors");
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [onlineCount] = useState(14); // Mock live counter

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Sub-tabs for the card groups
  const [acqTab, setAcqTab] = useState<"channels" | "referrers" | "campaigns">("channels");
  const [geoTab, setGeoTab] = useState<"map" | "countries" | "regions" | "cities">("countries");
  const [techTab, setTechTab] = useState<"browsers" | "os" | "devices">("browsers");
  const [eventTab, setEventTab] = useState<"all" | "actions" | "conversions">("all");
  const [funnelTab, setFunnelTab] = useState<"funnels" | "goals">("funnels");

  // Timeseries & Aggregates
  const timeseries = useMemo(() => generateRealisticMetrics(timeRange, Number(websiteId) || 3), [timeRange, websiteId]);

  const totals = useMemo(() => {
    const visitors = timeseries.reduce((acc, curr) => acc + curr.visitors, 0);
    const revenue = timeseries.reduce((acc, curr) => acc + curr.revenue, 0);
    const avgBounce = timeseries.reduce((acc, curr) => acc + curr.bounceRate, 0) / timeseries.length;
    const avgSession = timeseries.reduce((acc, curr) => acc + curr.sessionTime, 0) / timeseries.length;
    const avgConv = timeseries.reduce((acc, curr) => acc + curr.conversionRate, 0) / timeseries.length;

    return { visitors, revenue, avgBounce, avgSession, avgConv };
  }, [timeseries]);

  return (
    <div className="space-y-6 pb-20">

      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">

        {/* Left: Identity */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-zinc-400 hover:text-white transition-colors p-2 -ml-1 rounded-xl bg-[#262626]/50 hover:bg-[#262626] border border-white/[0.04] hover:border-white/[0.08] cursor-pointer"
            title="Back to websites"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <img
            src={`https://www.google.com/s2/favicons?domain=${siteDomain}&sz=64`}
            alt={siteDomain}
            className="w-7 h-7 object-contain rounded-lg shrink-0 bg-white/10 p-0.5"
            onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white leading-none">{siteDomain}</h1>
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
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Date Range Picker using Shadcn Select */}
          <div className="w-[140px]">
            <Select
              value={timeRange}
              onValueChange={(val) => {
                if (val !== "Custom...") setTimeRange(val as TimeRangeType);
              }}
            >
              <SelectTrigger className="bg-[#262626] border-white/[0.08] hover:border-white/[0.15] text-zinc-300 font-mono text-xs h-9 rounded-xl">
                <div className="flex items-center gap-2 truncate">
                  <Calendar className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {(["Today", "Last 24h", "7 Days", "30 Days", "YTD", "Custom..."] as TimeRangeType[]).map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter Button */}
          <button className="flex items-center gap-2 bg-[#262626] border border-white/[0.08] hover:border-white/[0.15] text-zinc-300 px-3.5 py-2 rounded-xl text-xs font-mono transition-colors cursor-pointer">
            <Filter className="h-4 w-4 text-zinc-400" />
            <span>Filter</span>
          </button>

          {/* Share & Embed Widget Button */}
          <button
            onClick={() => setIsShareOpen(true)}
            title="Share & Embed Analytics Widget"
            className="flex items-center gap-1.5 bg-[#262626] border border-white/[0.08] hover:border-white/[0.15] text-zinc-300 hover:text-white px-3 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer active:scale-95 shadow-xs"
          >
            <Share2 className="h-4 w-4 text-rose-400" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            title="Refresh Analytics"
            className="flex items-center justify-center bg-[#262626] border border-white/[0.08] hover:border-white/[0.15] text-zinc-300 p-2 rounded-xl transition-all cursor-pointer hover:text-white active:scale-95"
          >
            <RefreshCcw className={`h-4 w-4 transition-transform duration-500 ${isRefreshing ? "animate-spin text-rose-400" : ""}`} />
          </button>

          {/* Settings Button */}
          <Link
            href={`/dashboard/${websiteId}/settings`}
            title="Website Settings"
            className="flex items-center justify-center bg-[#262626] border border-white/[0.08] hover:border-white/[0.15] text-zinc-400 hover:text-white p-2 rounded-xl transition-all cursor-pointer active:scale-95"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* 2. Chart Card (KPI Ribbon & Main Chart) */}
      <div className="bg-[#262626] border border-white/[0.08] rounded-2xl p-5 space-y-6 shadow-xl">

        {/* KPI Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { id: "visitors", label: "Visitors", val: totals.visitors.toLocaleString(), icon: Users, format: "" },
            { id: "revenue", label: "MMR", val: `$${totals.revenue.toLocaleString()}`, icon: DollarSign, format: "" },
            { id: "conversionRate", label: "Conv. Rate", val: `${totals.avgConv.toFixed(1)}%`, icon: TrendingUp, format: "" },
            { id: "bounceRate", label: "Bounce Rate", val: `${totals.avgBounce.toFixed(1)}%`, icon: Percent, format: "" },
            { id: "sessionTime", label: "Session Time", val: `${Math.floor(totals.avgSession / 60)}m ${Math.floor(totals.avgSession % 60)}s`, icon: Clock, format: "" },
          ].map((metric) => (
            <button
              key={metric.id}
              onClick={() => setActiveMetric(metric.id as MetricType)}
              className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${activeMetric === metric.id
                ? "bg-[#2A2A2A] border-[#800E13] ring-1 ring-[#800E13]/50 shadow-lg shadow-[#800E13]/10"
                : "bg-[#1F1F1F] border-white/[0.04] hover:border-white/[0.1]"
                }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1.5">
                <span>{metric.label}</span>
                <metric.icon className={`h-3.5 w-3.5 ${activeMetric === metric.id ? "text-rose-400" : "text-zinc-500"}`} />
              </div>
              <div className="text-xl font-bold font-mono text-white tracking-tight">{metric.val}</div>
            </button>
          ))}

          {/* Live Online (Not clickable to chart, just indicator) */}
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
              <div className="text-xl font-bold font-mono text-white tracking-tight">{onlineCount}</div>
            </div>
          </div>
        </div>

        {/* Main Chart Area */}
        <div className="h-[280px] w-full pt-2">
          <AnalyticsChart data={timeseries} activeMetric={activeMetric} />
        </div>
      </div>

      {/* 3. Grid of Charts (Breakdowns) */}
      <div className="flex flex-col gap-5">

        {/* Row 2: 2 Columns (Acquisition & Location) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Card 1: Acquisition */}
          <div className="bg-[#262626] border border-white/[0.08] rounded-2xl p-5 flex flex-col h-[400px]">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-2">
              <div className="flex items-center gap-1 bg-[#1F1F1F] p-1 rounded-lg border border-white/[0.04] shadow-inner">
                {["channels", "referrers", "campaigns"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setAcqTab(tab as any)}
                    className={`text-[13px] font-medium capitalize transition-all px-3 py-1.5 rounded-md ${acqTab === tab ? "bg-[#262626] text-white shadow-sm border border-white/[0.08]" : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden min-h-0 pr-2">
              {acqTab === "channels" && <ChannelPieChart data={mockAcquisition.channels as any} />}
              {acqTab === "referrers" && <CustomBarList data={mockAcquisition.referrers} type="referrer" />}
              {acqTab === "campaigns" && <CustomBarList data={mockAcquisition.campaigns} type="campaign" />}
            </div>
          </div>

          {/* Card 2: Location */}
          <div className="bg-[#262626] border border-white/[0.08] rounded-2xl p-5 flex flex-col h-[400px]">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-2">
              <div className="flex items-center gap-1 bg-[#1F1F1F] p-1 rounded-lg border border-white/[0.04] shadow-inner">
                {(["map", "countries", "regions", "cities"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setGeoTab(tab)}
                    className={`text-[13px] font-medium capitalize transition-all px-3 py-1.5 rounded-md ${geoTab === tab ? "bg-[#262626] text-white shadow-sm border border-white/[0.08]" : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden min-h-0 pr-2">
              {geoTab === "map" && <InteractiveMap data={mockLocation.countries as any} />}
              {geoTab === "countries" && <CustomBarList data={mockLocation.countries} type="location" />}
              {geoTab === "regions" && <CustomBarList data={mockLocation.regions} type="location" />}
              {geoTab === "cities" && <CustomBarList data={mockLocation.cities} type="location" />}
            </div>
          </div>
        </div>

        {/* Row 3: 2 Columns (Technology & Events) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Card 3: Technology */}
          <div className="bg-[#262626] border border-white/[0.08] rounded-2xl p-5 flex flex-col h-[400px]">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-2">
              <div className="flex items-center gap-1 bg-[#1F1F1F] p-1 rounded-lg border border-white/[0.04] shadow-inner">
                {(["browsers", "os", "devices"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setTechTab(tab)}
                    className={`text-[13px] font-medium capitalize transition-all px-3 py-1.5 rounded-md ${techTab === tab ? "bg-[#262626] text-white shadow-sm border border-white/[0.08]" : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                      }`}
                  >
                    {tab === "os" ? "OS" : tab}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden min-h-0 pr-2">
              {techTab === "browsers" && <CustomBarList data={mockTech.browsers} type="tech" />}
              {techTab === "os" && <CustomBarList data={mockTech.os} type="tech" />}
              {techTab === "devices" && <CustomBarList data={mockTech.devices as any} type="tech" />}
            </div>
          </div>

          {/* Card 4: Events */}
          <div className="bg-[#262626] border border-white/[0.08] rounded-2xl p-5 flex flex-col h-[400px]">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-2">
              <div className="flex items-center gap-1 bg-[#1F1F1F] p-1 rounded-lg border border-white/[0.04] shadow-inner">
                {(["all", "actions", "conversions"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setEventTab(tab)}
                    className={`text-[13px] font-medium capitalize transition-all px-3 py-1.5 rounded-md ${eventTab === tab ? "bg-[#262626] text-white shadow-sm border border-white/[0.08]" : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <span className="text-xs font-mono text-zinc-500 pr-1">
                {mockEvents[eventTab].reduce((acc, curr) => acc + curr.views, 0).toLocaleString()} events
              </span>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden min-h-0 pr-2">
              <CustomBarList data={mockEvents[eventTab]} type="event" />
            </div>
          </div>
        </div>

        {/* Row 4: Full Width (Funnels & Goals) */}
        <div className="w-full bg-[#262626] border border-white/[0.08] rounded-2xl p-5 flex flex-col min-h-[500px] h-[500px]">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-2">
            <div className="flex items-center gap-1 bg-[#1F1F1F] p-1 rounded-lg border border-white/[0.04] shadow-inner">
              {(["funnels", "goals"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFunnelTab(tab)}
                  className={`text-[13px] font-medium capitalize transition-all px-3 py-1.5 rounded-md ${funnelTab === tab ? "bg-[#262626] text-white shadow-sm border border-white/[0.08]" : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {funnelTab === "funnels" && <FunnelVisualizer funnels={mockFunnels} />}
            {funnelTab === "goals" && (
              <div className="flex items-center justify-center h-full text-zinc-500 text-sm font-mono">
                Goals visualizer under construction
              </div>
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
