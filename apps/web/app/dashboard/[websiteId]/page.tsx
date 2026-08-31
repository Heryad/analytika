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
  Map
} from "lucide-react";
import { AnalyticsChart } from "@/components/analytics/analytics-chart";
import { InteractiveMap } from "@/components/analytics/interactive-map";
import { HorizontalBarChart } from "@/components/analytics/horizontal-bar-chart";
import { generateRealisticMetrics, mockAcquisition, mockLocation, mockTech } from "@/lib/mock-data";

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
  const [onlineCount] = useState(14); // Mock live counter

  // Sub-tabs for the 3 groups
  const [acqTab, setAcqTab] = useState<"channels" | "referrers" | "campaigns">("channels");
  const [geoTab, setGeoTab] = useState<"map" | "countries" | "regions" | "cities">("countries");
  const [techTab, setTechTab] = useState<"browsers" | "os" | "devices">("browsers");

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

  // Helper for generic shaded bar rows is no longer needed since we use Recharts HorizontalBarChart

  return (
    <div className="space-y-6 pb-20">

      {/* 1. Header Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">

        {/* Left: Identity */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-zinc-400 hover:text-white transition-colors p-1.5 -ml-1.5 rounded-xl hover:bg-[#262626] cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
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
              <a href={`https://${siteDomain}`} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-zinc-300">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
          <button className="ml-2 text-zinc-500 hover:text-white p-1.5 rounded-lg hover:bg-[#262626] transition-colors cursor-pointer">
            <Settings className="h-4 w-4" />
          </button>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative">
            <button
              onClick={() => setIsDateOpen(!isDateOpen)}
              className="flex items-center gap-2 bg-[#262626] border border-white/[0.08] hover:border-white/[0.15] text-zinc-300 px-3.5 py-2 rounded-xl text-xs font-mono transition-colors cursor-pointer"
            >
              <Calendar className="h-4 w-4 text-zinc-400" />
              <span>{timeRange}</span>
              <ChevronDown className="h-3.5 w-3.5 text-zinc-500 ml-1" />
            </button>
            {isDateOpen && (
              <div className="absolute top-full mt-2 right-0 w-48 bg-[#1F1F1F] border border-white/[0.08] rounded-xl shadow-2xl z-50 p-1">
                {(["Today", "Last 24h", "7 Days", "30 Days", "YTD", "Custom..."] as TimeRangeType[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => { if (r !== "Custom...") setTimeRange(r); setIsDateOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono cursor-pointer ${timeRange === r ? 'bg-[#800E13] text-white' : 'text-zinc-400 hover:bg-[#262626] hover:text-white'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="flex items-center gap-2 bg-[#262626] border border-white/[0.08] hover:border-white/[0.15] text-zinc-300 px-3 py-2 rounded-xl text-xs font-mono transition-colors cursor-pointer">
            <Filter className="h-4 w-4 text-zinc-400" />
            <span>Filter</span>
          </button>

          <button className="flex items-center justify-center bg-[#262626] border border-white/[0.08] hover:border-white/[0.15] text-zinc-300 p-2 rounded-xl transition-colors cursor-pointer">
            <RefreshCcw className="h-4 w-4" />
          </button>
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

        {/* Top 2 Columns (Acquisition & Technology) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Group 1: Acquisition */}
          <div className="bg-[#262626] border border-white/[0.08] rounded-2xl p-5 flex flex-col h-[400px]">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-2">
              <div className="flex gap-4">
                {(["channels", "referrers", "campaigns"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setAcqTab(tab)}
                    className={`text-xs font-mono font-medium capitalize pb-1 cursor-pointer transition-colors ${acqTab === tab ? "text-white border-b-2 border-[#800E13]" : "text-zinc-500 hover:text-zinc-300"}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-hidden pr-2">
              {acqTab === "channels" && <HorizontalBarChart data={mockAcquisition.channels} />}
              {acqTab === "referrers" && <HorizontalBarChart data={mockAcquisition.referrers} />}
              {acqTab === "campaigns" && <HorizontalBarChart data={mockAcquisition.campaigns} />}
            </div>
          </div>

          {/* Group 3: Technology */}
          <div className="bg-[#262626] border border-white/[0.08] rounded-2xl p-5 flex flex-col h-[400px]">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-2">
              <div className="flex gap-4">
                {(["browsers", "os", "devices"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setTechTab(tab)}
                    className={`text-xs font-mono font-medium capitalize pb-1 cursor-pointer transition-colors ${techTab === tab ? "text-white border-b-2 border-[#800E13]" : "text-zinc-500 hover:text-zinc-300"}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-hidden pr-2">
              {techTab === "browsers" && <HorizontalBarChart data={mockTech.browsers} />}
              {techTab === "os" && <HorizontalBarChart data={mockTech.os} />}
              {techTab === "devices" && <HorizontalBarChart data={mockTech.devices} />}
            </div>
          </div>
        </div>

        {/* Full Width Row (Location) */}
        <div className="w-full bg-[#262626] border border-white/[0.08] rounded-2xl p-5 flex flex-col h-[400px]">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-2">
            <div className="flex gap-4">
              {(["countries", "regions", "cities"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setGeoTab(tab)}
                  className={`text-xs font-mono font-medium capitalize pb-1 cursor-pointer transition-colors ${geoTab === tab ? "text-white border-b-2 border-[#800E13]" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-hidden pr-2">
            {geoTab === "countries" && <InteractiveMap data={mockLocation.countries as any} />}
            {geoTab === "regions" && <HorizontalBarChart data={mockLocation.regions} />}
            {geoTab === "cities" && <HorizontalBarChart data={mockLocation.cities} />}
          </div>
        </div>
      </div>
    </div>
  );
}
