"use client";

import { useState } from "react";
import {
  Users, DollarSign, TrendingUp, Percent, Clock, Activity,
  ExternalLink, Calendar, Filter,
} from "lucide-react";
import { AnalyticsChart } from "@/components/analytics/analytics-chart";
import { ChannelPieChart } from "@/components/analytics/channel-pie-chart";
import { CustomBarList } from "@/components/analytics/custom-bar-list";
import { WebsiteFavicon } from "@/components/website-favicon";
import {
  MOCK_TIMESERIES,
  MOCK_OVERVIEW,
  MOCK_CHANNELS,
  MOCK_REFERRERS,
  MOCK_CAMPAIGNS,
  MOCK_PAGES,
  MOCK_COUNTRIES,
  MOCK_BROWSERS,
  MOCK_OS,
  MOCK_DEVICES,
  MOCK_EVENTS,
  MOCK_ONLINE,
  MOCK_FUNNELS,
  MOCK_MILESTONES,
} from "@/lib/mock-data";

import { FunnelVisualizer } from "@/components/analytics/funnel-visualizer";
import { MilestonesVisualizer } from "@/components/analytics/milestones-visualizer";

type MetricType = "visitors" | "revenue" | "conversionRate" | "bounceRate" | "sessionTime";

const SITE_DOMAIN = "google.com";

const KPI_METRICS = [
  {
    id: "visitors" as MetricType,
    label: "Visitors",
    val: MOCK_OVERVIEW.visitors.toLocaleString(),
    icon: Users,
  },
  {
    id: "revenue" as MetricType,
    label: "Revenue",
    val: `$${MOCK_OVERVIEW.revenue.toLocaleString()}`,
    icon: DollarSign,
  },
  {
    id: "conversionRate" as MetricType,
    label: "Conv. Rate",
    val: `${((MOCK_OVERVIEW.purchases / MOCK_OVERVIEW.visitors) * 100).toFixed(1)}%`,
    icon: TrendingUp,
  },
  {
    id: "bounceRate" as MetricType,
    label: "Bounce Rate",
    val: `${MOCK_OVERVIEW.bounceRate}%`,
    icon: Percent,
  },
  {
    id: "sessionTime" as MetricType,
    label: "Session Time",
    val: `${Math.floor(MOCK_OVERVIEW.avgSessionDurationSeconds / 60)}m ${MOCK_OVERVIEW.avgSessionDurationSeconds % 60}s`,
    icon: Clock,
  },
];

export function InteractivePreview() {
  const [activeMetric, setActiveMetric] = useState<MetricType>("visitors");
  const [acqTab, setAcqTab] = useState<"channels" | "referrers" | "campaigns" | "pages">("channels");
  const [techTab, setTechTab] = useState<"browsers" | "os" | "devices">("browsers");
  const [funnelTab, setFunnelTab] = useState<"funnels" | "milestones">("funnels");

  return (
    <section
      id="preview"
      className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 mb-24 scroll-mt-24"
    >
      {/* Browser chrome wrapper */}
      <div className="relative rounded-2xl bg-[#1A1A1A] border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden">

        {/* Browser top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] bg-[#1F1F1F]">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
            <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
            <span className="h-3 w-3 rounded-full bg-[#28C840]" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="rounded-lg bg-[#141414] px-5 py-1.5 text-xs text-zinc-400 font-mono border border-white/[0.04] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              analytika.me/dashboard/google.com
            </div>
          </div>
          <div className="w-14 flex items-center justify-end">
            <span className="text-[10px] font-mono text-zinc-600 bg-[#141414] px-2 py-1 rounded-md border border-white/[0.04]">DEMO</span>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="p-4 sm:p-5 space-y-4 bg-[#141414]">

          {/* ── Header toolbar ── */}
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
            <div className="flex items-center gap-2.5">
              <WebsiteFavicon
                domain={SITE_DOMAIN}
                className="w-7 h-7 rounded-lg bg-white/10 p-0.5 object-contain shrink-0"
              />
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white tracking-tight">{SITE_DOMAIN}</span>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#1F1F1F] border border-white/[0.06] text-zinc-400 text-xs font-mono px-3 py-1.5 rounded-xl">
                <Calendar className="w-3.5 h-3.5" />
                <span>30 Days</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#1F1F1F] border border-white/[0.06] text-zinc-400 text-xs font-mono px-3 py-1.5 rounded-xl">
                <Filter className="w-3.5 h-3.5" />
                <span>All Traffic</span>
              </div>
            </div>
          </div>

          {/* ── KPI ribbon + chart card ── */}
          <div className="bg-[#1F1F1F] border border-white/[0.06] rounded-2xl p-4 space-y-4">
            {/* KPI tiles */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {KPI_METRICS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveMetric(m.id)}
                  className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                    activeMetric === m.id
                      ? "bg-[#2A2A2A] border-[#800E13] ring-1 ring-[#800E13]/40 shadow-lg shadow-[#800E13]/10"
                      : "bg-[#141414] border-white/[0.04] hover:border-white/[0.1]"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1.5">
                    <span>{m.label}</span>
                    <m.icon className={`h-3 w-3 ${activeMetric === m.id ? "text-rose-400" : "text-zinc-600"}`} />
                  </div>
                  <div className="text-base font-bold font-mono text-white tracking-tight">{m.val}</div>
                </button>
              ))}

              {/* Online now */}
              <div className="p-3 rounded-xl text-left border bg-[#141414] border-white/[0.04]">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1.5">
                  <span>Online Now</span>
                  <Activity className="h-3 w-3 text-emerald-500" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  <span className="text-base font-bold font-mono text-white">{MOCK_ONLINE}</span>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="h-[200px] w-full">
              <AnalyticsChart data={MOCK_TIMESERIES} activeMetric={activeMetric} />
            </div>
          </div>

          {/* ── Row 2: Acquisition + Technology ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Acquisition */}
            <div className="bg-[#1F1F1F] border border-white/[0.06] rounded-2xl p-4 flex flex-col h-[340px]">
              <div className="flex items-center gap-1 bg-[#141414] p-1 rounded-lg border border-white/[0.04] mb-3 self-start">
                {(["channels", "referrers", "campaigns", "pages"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setAcqTab(tab)}
                    className={`text-[11px] font-medium capitalize transition-all px-2.5 py-1 rounded-md cursor-pointer ${
                      acqTab === tab
                        ? "bg-[#262626] text-white shadow-sm border border-white/[0.08]"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                {acqTab === "channels" && <ChannelPieChart data={MOCK_CHANNELS} />}
                {acqTab === "referrers" && (
                  <CustomBarList
                    data={MOCK_REFERRERS.map((r) => ({ name: r.name, views: r.views, percentage: r.percentage, domain: r.domain }))}
                    type="referrer"
                  />
                )}
                {acqTab === "campaigns" && (
                  <CustomBarList
                    data={MOCK_CAMPAIGNS.map((c) => ({ name: c.name, views: c.views, percentage: c.percentage }))}
                    type="campaign"
                  />
                )}
                {acqTab === "pages" && (
                  <CustomBarList
                    data={MOCK_PAGES.map((p) => ({ name: p.name, views: p.views, percentage: p.percentage }))}
                    type="page"
                  />
                )}
              </div>
            </div>

            {/* Technology */}
            <div className="bg-[#1F1F1F] border border-white/[0.06] rounded-2xl p-4 flex flex-col h-[340px]">
              <div className="flex items-center gap-1 bg-[#141414] p-1 rounded-lg border border-white/[0.04] mb-3 self-start">
                {(["browsers", "os", "devices"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setTechTab(tab)}
                    className={`text-[11px] font-medium transition-all px-2.5 py-1 rounded-md cursor-pointer ${
                      techTab === tab
                        ? "bg-[#262626] text-white shadow-sm border border-white/[0.08]"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {tab === "os" ? "OS" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                {techTab === "browsers" && (
                  <CustomBarList
                    data={MOCK_BROWSERS.map((b) => ({ name: b.name, views: b.views, percentage: b.percentage, domain: b.domain }))}
                    type="tech"
                  />
                )}
                {techTab === "os" && (
                  <CustomBarList
                    data={MOCK_OS.map((o) => ({ name: o.name, views: o.views, percentage: o.percentage, domain: o.domain }))}
                    type="tech"
                  />
                )}
                {techTab === "devices" && (
                  <CustomBarList
                    data={MOCK_DEVICES.map((d) => ({ name: d.name, views: d.views, percentage: d.percentage, lucide: d.lucide }))}
                    type="tech"
                  />
                )}
              </div>
            </div>
          </div>

          {/* ── Row 3: Geo + Events ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Countries */}
            <div className="bg-[#1F1F1F] border border-white/[0.06] rounded-2xl p-4 flex flex-col h-[300px]">
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 font-mono">
                Top Countries
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <CustomBarList
                  data={MOCK_COUNTRIES.map((c) => ({ name: c.name, views: c.views, percentage: c.percentage, code: c.code }))}
                  type="location"
                />
              </div>
            </div>

            {/* Custom Events */}
            <div className="bg-[#1F1F1F] border border-white/[0.06] rounded-2xl p-4 flex flex-col h-[300px]">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                  Custom Events
                </div>
                <span className="text-xs font-mono text-zinc-500">
                  {MOCK_EVENTS.reduce((s, e) => s + e.views, 0).toLocaleString()} total
                </span>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <CustomBarList
                  data={MOCK_EVENTS.map((e) => ({ name: e.name, views: e.views, percentage: e.percentage, lucide: e.lucide }))}
                  type="event"
                />
              </div>
            </div>
          </div>

          {/* ── Row 4: Funnels & Milestones ── */}
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
              <FunnelVisualizer funnels={MOCK_FUNNELS} timeRange="30d" readOnly={true} />
            )}
            {funnelTab === "milestones" && (
              <MilestonesVisualizer initialItems={MOCK_MILESTONES} timeRange="30d" readOnly={true} />
            )}
          </div>

        </div>

        {/* Gradient fade at bottom to hint there's more */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0E0E0E] to-transparent" />

        {/* "Try it yourself" CTA overlay at bottom */}
        <div className="relative flex items-center justify-center py-5 bg-[#0E0E0E]/80 border-t border-white/[0.06]">
          <p className="text-xs text-zinc-400 font-mono">
            ↑ Fully interactive — click any metric or tab above
          </p>
        </div>

      </div>
    </section>
  );
}
