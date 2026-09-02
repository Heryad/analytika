"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Share2,
  Copy,
  Check,
  Sparkles,
  BarChart2,
  Radio
} from "lucide-react";

import { analyticsApi, OverviewMetrics } from "@/lib/api";

interface ShareWidgetModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  siteDomain: string;
  websiteId: string;
  onlineCount?: number;
}

type WidgetType = "sparkline" | "live-pill";
type WidgetTheme = "dark" | "light" | "transparent";
type EmbedFormat = "iframe" | "react" | "markdown";

const CHART_COLORS = [
  { id: "crimson", name: "Crimson", hex: "#800E13" },
  { id: "rose", name: "Rose", hex: "#F43F5E" },
  { id: "violet", name: "Violet", hex: "#8B5CF6" },
  { id: "blue", name: "Electric Blue", hex: "#0EA5E9" },
  { id: "emerald", name: "Emerald", hex: "#10B981" },
  { id: "amber", name: "Amber", hex: "#F59E0B" },
  { id: "cyan", name: "Cyan", hex: "#06B6D4" },
  { id: "fuchsia", name: "Fuchsia", hex: "#D946EF" },
];

export function ShareWidgetModal({
  isOpen,
  onOpenChange,
  siteDomain,
  websiteId,
  onlineCount = 0,
}: ShareWidgetModalProps) {
  // Widget Customizer State (Snapshot Card & Live Visitor Pill)
  const [widgetType, setWidgetType] = useState<WidgetType>("sparkline");
  const [theme, setTheme] = useState<WidgetTheme>("dark");
  const [chartColor, setChartColor] = useState<string>("#800E13");
  const [metric, setMetric] = useState<"visitors" | "pageviews" | "revenue">("visitors");
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("30d");
  const [embedFormat, setEmbedFormat] = useState<EmbedFormat>("iframe");
  const [copiedCode, setCopiedCode] = useState(false);

  // Live Metrics & Real Timeseries Spline State
  const [overviewMetrics, setOverviewMetrics] = useState<OverviewMetrics | null>(null);
  const [realPathD, setRealPathD] = useState<string>("M 0 35 L 200 35");

  useEffect(() => {
    if (!isOpen || !websiteId) return;

    analyticsApi
      .getOverview(websiteId, timeRange)
      .then((res) => {
        if (res.success && res.metrics) {
          setOverviewMetrics(res.metrics);
        }
      })
      .catch(() => {});

    analyticsApi
      .getTimeseries(websiteId, timeRange)
      .then((res) => {
        if (res.success && Array.isArray(res.timeseries) && res.timeseries.length > 0) {
          const vals = res.timeseries.map((pt) => {
            if (metric === "visitors") return pt.visitors || 0;
            if (metric === "pageviews") return pt.pageviews || 0;
            return pt.revenue || 0;
          });

          const max = Math.max(...vals, 1);
          const min = Math.min(...vals, 0);
          const rangeVal = max - min || 1;

          if (vals.every((v) => v === 0)) {
            setRealPathD("M 0 35 L 200 35");
            return;
          }

          const points = vals.map((v, i) => ({
            x: (i / Math.max(1, vals.length - 1)) * 200,
            y: 35 - ((v - min) / rangeVal) * 30,
          }));

          let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
          for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const cx = (prev.x + curr.x) / 2;
            d += ` Q ${prev.x.toFixed(1)} ${prev.y.toFixed(1)} ${cx.toFixed(1)} ${((prev.y + curr.y) / 2).toFixed(1)}`;
          }
          const last = points[points.length - 1];
          d += ` T ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
          setRealPathD(d);
        } else {
          setRealPathD("M 0 35 L 200 35");
        }
      })
      .catch(() => {
        setRealPathD("M 0 35 L 200 35");
      });
  }, [isOpen, websiteId, metric, timeRange]);

  const publicShareUrl = `https://analytika.me/share/${websiteId}`;

  // Dimensions based on widget type
  const widgetDimensions = useMemo(() => {
    switch (widgetType) {
      case "sparkline":
        return { width: 330, height: 165 };
      case "live-pill":
        return { width: 280, height: 48 };
    }
  }, [widgetType]);

  // Metric Labels & Real Numbers
  const metricLabel = useMemo(() => {
    switch (metric) {
      case "visitors":
        return "Unique Visitors";
      case "pageviews":
        return "Page Views";
      case "revenue":
        return "Attributed MRR";
      default:
        return "Unique Visitors";
    }
  }, [metric]);

  const displayCount = useMemo(() => {
    if (!overviewMetrics) {
      return metric === "revenue" ? "$0" : "0";
    }
    if (metric === "visitors") {
      return (overviewMetrics.visitors || 0).toLocaleString();
    }
    if (metric === "pageviews") {
      return (overviewMetrics.pageviews || 0).toLocaleString();
    }
    if (metric === "revenue") {
      return `$${(overviewMetrics.revenue || 0).toLocaleString()}`;
    }
    return "0";
  }, [overviewMetrics, metric]);

  const embedUrl = useMemo(() => {
    const targetId = websiteId || siteDomain;
    return `https://analytika.app/embed/widget?id=${targetId}&type=${widgetType}&theme=${theme}&color=${encodeURIComponent(
      chartColor
    )}&metric=${metric}&range=${timeRange}`;
  }, [siteDomain, websiteId, widgetType, theme, chartColor, metric, timeRange]);

  const badgeUrl = useMemo(() => {
    const targetId = websiteId || siteDomain;
    return `https://analytika.app/badge/${targetId}/${metric}.svg?theme=${theme}&color=${encodeURIComponent(
      chartColor
    )}`;
  }, [siteDomain, websiteId, metric, theme, chartColor]);

  // Generated Embed Code string for Clipboard
  const rawCodeToCopy = useMemo(() => {
    if (embedFormat === "iframe") {
      return `<iframe\n  src="${embedUrl}"\n  width="${widgetDimensions.width}"\n  height="${widgetDimensions.height}"\n  frameborder="0"\n  scrolling="no"\n  loading="lazy"\n  style="border-radius: 18px; border: ${theme === "dark"
          ? "1px solid rgba(255,255,255,0.08)"
          : theme === "light"
            ? "1px solid rgba(0,0,0,0.08)"
            : "none"
        };"\n></iframe>`;
    }

    if (embedFormat === "react") {
      return `import React from "react";\n\nexport function AnalytikaWidget() {\n  return (\n    <iframe\n      src="${embedUrl}"\n      width="${widgetDimensions.width}"\n      height="${widgetDimensions.height}"\n      className="rounded-2xl border ${theme === "dark" ? "border-white/[0.08]" : "border-black/[0.08]"
        }"\n      loading="lazy"\n    />\n  );\n}`;
    }

    return `[![${siteDomain} Analytics](${badgeUrl})](${publicShareUrl})`;
  }, [embedFormat, embedUrl, widgetDimensions, theme, siteDomain, badgeUrl, publicShareUrl]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(rawCodeToCopy);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[96vw] h-[94vh] max-h-[95vh] bg-[#1A1A1A] border-white/[0.1] text-white p-0 overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <DialogHeader className="p-5 border-b border-white/[0.08] shrink-0 bg-[#1F1F1F]">
          <DialogTitle className="text-base font-semibold text-white flex items-center gap-2">
            <Share2 className="w-4 h-4 text-zinc-400" />
            <span>Share & Embed Widgets</span>
          </DialogTitle>
        </DialogHeader>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08] overflow-hidden">

          {/* Left Controls (5 cols) */}
          <div className="lg:col-span-5 p-5 space-y-4 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-4">

              {/* 1. Widget Style Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Widget Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "sparkline", label: "Snapshot Card", desc: "Trend graph & live stats" },
                    { id: "live-pill", label: "Live Visitor Pill", desc: "Realtime online beacon" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setWidgetType(item.id as WidgetType)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${widgetType === item.id
                          ? "bg-[#262626] border-[#800E13] text-white shadow-sm ring-1 ring-[#800E13]/50"
                          : "bg-[#161616] border-white/[0.04] text-zinc-400 hover:text-zinc-200 hover:border-white/[0.08]"
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        {item.id === "sparkline" ? (
                          <BarChart2 className={`w-3.5 h-3.5 ${widgetType === item.id ? "text-rose-400" : "text-zinc-500"}`} />
                        ) : (
                          <Radio className={`w-3.5 h-3.5 ${widgetType === item.id ? "text-emerald-400" : "text-zinc-500"}`} />
                        )}
                        <span className="text-xs font-semibold text-white">{item.label}</span>
                      </div>
                      <div className="text-[10px] text-zinc-500">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Color Theme Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Theme</label>
                <div className="flex items-center gap-1.5 bg-[#141414] p-1 rounded-xl border border-white/[0.06]">
                  {(["dark", "light", "transparent"] as WidgetTheme[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTheme(t)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer text-center ${theme === t
                          ? "bg-[#262626] text-white shadow-sm border border-white/[0.08]"
                          : "text-zinc-400 hover:text-zinc-200"
                        }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. 8 Chart Colors Selector (For Snapshot Card) */}
              {widgetType === "sparkline" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Chart Color
                    </label>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {CHART_COLORS.find((c) => c.hex === chartColor)?.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-[#141414] rounded-xl border border-white/[0.06] gap-1.5">
                    {CHART_COLORS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        title={c.name}
                        onClick={() => setChartColor(c.hex)}
                        className={`w-6 h-6 rounded-full transition-all cursor-pointer flex items-center justify-center shrink-0 ${chartColor === c.hex
                            ? "ring-2 ring-white ring-offset-2 ring-offset-[#141414] scale-110"
                            : "hover:scale-105 opacity-75 hover:opacity-100"
                          }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {chartColor === c.hex && <Check className="w-3 h-3 text-white drop-shadow-md" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Metric & Range (When applicable) */}
              {widgetType === "sparkline" && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Metric</label>
                    <Select value={metric} onValueChange={(val) => setMetric(val as any)}>
                      <SelectTrigger className="bg-[#161616] border-white/[0.08] text-white text-xs h-9 rounded-xl">
                        <span className="truncate text-left block">
                          {metric === "visitors" ? "Unique Visitors" : metric === "pageviews" ? "Page Views" : "Revenue (MRR)"}
                        </span>
                      </SelectTrigger>
                      <SelectContent className="bg-[#1F1F1F] border-white/[0.08] text-zinc-200">
                        <SelectItem value="visitors" className="text-xs cursor-pointer">Unique Visitors</SelectItem>
                        <SelectItem value="pageviews" className="text-xs cursor-pointer">Page Views</SelectItem>
                        <SelectItem value="revenue" className="text-xs cursor-pointer">Revenue (MRR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Timeframe</label>
                    <Select value={timeRange} onValueChange={(val) => setTimeRange(val as any)}>
                      <SelectTrigger className="bg-[#161616] border-white/[0.08] text-white text-xs h-9 rounded-xl">
                        <span className="truncate text-left block">
                          {timeRange === "24h" ? "Last 24 Hours" : timeRange === "7d" ? "Last 7 Days" : "Last 30 Days"}
                        </span>
                      </SelectTrigger>
                      <SelectContent className="bg-[#1F1F1F] border-white/[0.08] text-zinc-200">
                        <SelectItem value="24h" className="text-xs cursor-pointer">Last 24 Hours</SelectItem>
                        <SelectItem value="7d" className="text-xs cursor-pointer">Last 7 Days</SelectItem>
                        <SelectItem value="30d" className="text-xs cursor-pointer">Last 30 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Right Column: Preview & Embed Code (7 cols) */}
          <div className="lg:col-span-7 p-5 space-y-4 overflow-y-auto bg-[#141414] flex flex-col justify-between">
            <div className="space-y-4">

              {/* Preview Container */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                    <span>Live Widget Preview</span>
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {widgetDimensions.width} × {widgetDimensions.height}px
                  </span>
                </div>

                {/* The Visual Preview Canvas */}
                <div className="rounded-2xl bg-[#0B0B0B] border border-white/[0.06] p-6 flex items-center justify-center min-h-[190px] relative overflow-hidden bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:12px_12px] shadow-inner">

                  {/* TYPE 1: SNAPSHOT CARD */}
                  {widgetType === "sparkline" && (
                    <div
                      className={`w-[320px] p-4 rounded-2xl transition-all shadow-2xl flex flex-col justify-between ${theme === "dark"
                          ? "bg-[#181818] border border-white/[0.08] text-white shadow-black/80"
                          : theme === "light"
                            ? "bg-white border border-black/[0.08] text-zinc-900 shadow-xl shadow-black/10"
                            : "bg-white/[0.06] backdrop-blur-xl text-white border border-white/[0.12] shadow-2xl"
                        }`}
                    >
                      {/* Top Row: Domain Identity */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${siteDomain}&sz=64`}
                            alt=""
                            className="w-4 h-4 rounded-xs"
                          />
                          <span className="font-bold text-xs truncate max-w-[200px]">{siteDomain}</span>
                        </div>
                      </div>

                      {/* Middle Row: Big Metric Number & Spline Chart with Selected Color */}
                      <div className="flex items-end justify-between my-2.5">
                        <div>
                          <div className="text-2xl font-extrabold font-mono tracking-tight leading-none">
                            {displayCount}
                          </div>
                          <div
                            className={`text-[10px] font-mono mt-1 ${
                              theme === "light" ? "text-zinc-500" : "text-zinc-400"
                            }`}
                          >
                            {metricLabel} ({timeRange})
                          </div>
                        </div>

                        {/* Spline Chart */}
                        <div className="w-24 h-9 relative">
                          <svg className="w-full h-full overflow-visible" viewBox="0 0 200 40">
                            <defs>
                              <linearGradient id="widgetSparkGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={chartColor} stopOpacity="0.4" />
                                <stop offset="100%" stopColor={chartColor} stopOpacity="0.0" />
                              </linearGradient>
                            </defs>
                            {/* Area fill */}
                            <path
                              d={`${realPathD} L 200 40 L 0 40 Z`}
                              fill="url(#widgetSparkGrad)"
                            />
                            {/* Spline Stroke */}
                            <path
                              d={realPathD}
                              fill="none"
                              stroke={chartColor}
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                            {/* Glowing End Dot */}
                            <circle cx="200" cy="4" r="3.5" fill={chartColor} />
                          </svg>
                        </div>
                      </div>

                      {/* Bottom Row: Analytika Brand Link */}
                      <div className={`pt-2 border-t flex items-center justify-between ${theme === "light" ? "border-black/[0.08]" : "border-white/[0.08]"
                        }`}>
                        <a
                          href="https://analytika.app"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 transition-opacity hover:opacity-80 cursor-pointer"
                        >
                          <Image
                            src="/logo.svg"
                            alt="Analytika Logo"
                            width={14}
                            height={14}
                            className="w-3.5 h-3.5 object-contain"
                          />
                          <span className={`text-[11px] font-bold tracking-tight ${theme === "light" ? "text-zinc-900" : "text-white"
                            }`}>
                            Analytika
                          </span>
                        </a>
                      </div>
                    </div>
                  )}

                  {/* TYPE 2: LIVE VISITOR PILL */}
                  {widgetType === "live-pill" && (
                    <div
                      className={`inline-flex items-center gap-3 px-4 py-2.5 rounded-full transition-all shadow-2xl ${theme === "dark"
                          ? "bg-[#181818] border border-white/[0.08] text-white shadow-black/80"
                          : theme === "light"
                            ? "bg-white border border-black/[0.08] text-zinc-900 shadow-xl shadow-black/10"
                            : "bg-white/[0.08] backdrop-blur-xl text-white border border-white/[0.15] shadow-2xl"
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="relative flex items-center justify-center">
                          <span className="absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75 animate-ping" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                        </div>
                        <span className={`font-mono font-bold text-xs ${theme === "light" ? "text-zinc-900" : "text-white"}`}>
                          {onlineCount}
                        </span>
                        <span className={`text-[11px] font-medium ${theme === "light" ? "text-zinc-500" : "text-zinc-400"}`}>
                          online now
                        </span>
                      </div>
                      <span className={theme === "light" ? "text-zinc-300" : "text-zinc-600"}>|</span>
                      <div className="flex items-center gap-1.5">
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${siteDomain}&sz=32`}
                          alt=""
                          className="w-3.5 h-3.5 rounded-xs"
                        />
                        <span className={`font-mono text-[11px] font-medium truncate max-w-[120px] ${theme === "light" ? "text-zinc-800" : "text-zinc-300"}`}>
                          {siteDomain}
                        </span>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Code Snippet Export Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  {/* Format Pills */}
                  <div className="flex items-center gap-1 bg-[#181818] p-1 rounded-xl border border-white/[0.06]">
                    {(["iframe", "react", "markdown"] as EmbedFormat[]).map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setEmbedFormat(fmt)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase font-mono transition-all cursor-pointer ${embedFormat === fmt
                            ? "bg-[#262626] text-white shadow-sm border border-white/[0.08]"
                            : "text-zinc-500 hover:text-zinc-300"
                          }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyCode}
                    className="border-white/[0.08] hover:bg-[#262626] text-zinc-300 text-xs h-8 rounded-xl cursor-pointer"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        Copy Code
                      </>
                    )}
                  </Button>
                </div>

                {/* Syntax Highlighted Terminal Window */}
                <div className="rounded-xl bg-[#0D0D0D] border border-white/[0.08] overflow-hidden shadow-inner">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-[#161616] border-b border-white/[0.06]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                      <span className="text-[11px] font-mono text-zinc-400 ml-2">
                        {embedFormat === "iframe" && "widget.html"}
                        {embedFormat === "react" && "AnalytikaWidget.tsx"}
                        {embedFormat === "markdown" && "README.md"}
                      </span>
                    </div>
                  </div>

                  {/* Syntax Highlighted Code Box */}
                  <div className="p-3 font-mono text-[11px] text-zinc-300 overflow-x-auto whitespace-pre leading-relaxed">
                    {embedFormat === "iframe" && (
                      <>
                        &lt;<span className="text-rose-400">iframe</span>{"\n"}
                        {"  "}<span className="text-amber-300">src</span>=<span className="text-emerald-300">&quot;{embedUrl}&quot;</span>{"\n"}
                        {"  "}<span className="text-amber-300">width</span>=<span className="text-emerald-300">&quot;{widgetDimensions.width}&quot;</span>{"\n"}
                        {"  "}<span className="text-amber-300">height</span>=<span className="text-emerald-300">&quot;{widgetDimensions.height}&quot;</span>{"\n"}
                        {"  "}<span className="text-amber-300">frameborder</span>=<span className="text-emerald-300">&quot;0&quot;</span>{"\n"}
                        {"  "}<span className="text-amber-300">scrolling</span>=<span className="text-emerald-300">&quot;no&quot;</span>{"\n"}
                        {"  "}<span className="text-zinc-400">loading</span>=<span className="text-emerald-300">&quot;lazy&quot;</span>{"\n"}
                        {"  "}<span className="text-amber-300">style</span>=<span className="text-emerald-300">&quot;border-radius: 18px; border: {theme === "dark" ? "1px solid rgba(255,255,255,0.08)" : theme === "light" ? "1px solid rgba(0,0,0,0.08)" : "none"};&quot;</span>{"\n"}
                        &gt;&lt;/<span className="text-rose-400">iframe</span>&gt;
                      </>
                    )}

                    {embedFormat === "react" && (
                      <>
                        <span className="text-rose-400">import</span> React <span className="text-rose-400">from</span> <span className="text-emerald-300">&quot;react&quot;</span>;{"\n\n"}
                        <span className="text-rose-400">export function</span> <span className="text-amber-300">AnalytikaWidget</span>() {"{\n"}
                        {"  "}<span className="text-rose-400">return</span> ({"\n"}
                        {"    "}&lt;<span className="text-amber-300">iframe</span>{"\n"}
                        {"      "}<span className="text-amber-300">src</span>=<span className="text-emerald-300">&quot;{embedUrl}&quot;</span>{"\n"}
                        {"      "}<span className="text-amber-300">width</span>=<span className="text-emerald-300">&quot;{widgetDimensions.width}&quot;</span>{"\n"}
                        {"      "}<span className="text-amber-300">height</span>=<span className="text-emerald-300">&quot;{widgetDimensions.height}&quot;</span>{"\n"}
                        {"      "}<span className="text-zinc-400">className</span>=<span className="text-emerald-300">&quot;rounded-2xl border {theme === "dark" ? "border-white/[0.08]" : "border-black/[0.08]"}&quot;</span>{"\n"}
                        {"      "}<span className="text-zinc-400">loading</span>=<span className="text-emerald-300">&quot;lazy&quot;</span>{"\n"}
                        {"    "}/&gt;{"\n"}
                        {"  "});{"\n"}
                        {"}"}
                      </>
                    )}

                    {embedFormat === "markdown" && (
                      <>
                        <span className="text-rose-400">[!</span>[<span className="text-amber-300">{siteDomain} Analytics</span>](<span className="text-emerald-300">{badgeUrl}</span>)<span className="text-rose-400">]</span>(<span className="text-emerald-300">{publicShareUrl}</span>)
                      </>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-end gap-2.5 p-4 border-t border-white/[0.08] bg-[#1F1F1F] shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-zinc-400 hover:text-white text-xs h-9 px-3 rounded-xl cursor-pointer"
          >
            Close
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleCopyCode}
            className="bg-[#800E13] hover:bg-[#9e1218] text-white text-xs font-medium h-9 px-5 rounded-xl cursor-pointer shadow-xs transition-all flex items-center gap-1.5"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? "Copied to Clipboard!" : "Copy Embed Code"}</span>
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
