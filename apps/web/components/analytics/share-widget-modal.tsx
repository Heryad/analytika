"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Share2,
  Code2,
  Globe,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Activity,
  BarChart2
} from "lucide-react";

interface ShareWidgetModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  siteDomain: string;
  websiteId: string;
  onlineCount?: number;
}

type WidgetType = "sparkline" | "live-pill" | "kpi-card" | "github-badge";
type WidgetTheme = "dark" | "light" | "transparent";
type EmbedFormat = "iframe" | "react" | "markdown";

export function ShareWidgetModal({
  isOpen,
  onOpenChange,
  siteDomain,
  websiteId,
  onlineCount = 14,
}: ShareWidgetModalProps) {
  // Modal Tab
  const [modalTab, setModalTab] = useState<"widget" | "public-link">("widget");

  // Widget Customizer State
  const [widgetType, setWidgetType] = useState<WidgetType>("sparkline");
  const [theme, setTheme] = useState<WidgetTheme>("dark");
  const [metric, setMetric] = useState<"visitors" | "pageviews" | "revenue">("visitors");
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("30d");
  const [embedFormat, setEmbedFormat] = useState<EmbedFormat>("iframe");
  const [copiedCode, setCopiedCode] = useState(false);

  // Public Link State
  const [copiedLink, setCopiedLink] = useState(false);
  const publicShareUrl = `https://analytika.dev/share/${siteDomain}`;

  // Dimensions based on widget type
  const widgetDimensions = useMemo(() => {
    switch (widgetType) {
      case "sparkline":
        return { width: 340, height: 145 };
      case "live-pill":
        return { width: 260, height: 44 };
      case "kpi-card":
        return { width: 340, height: 165 };
      case "github-badge":
        return { width: 230, height: 28 };
    }
  }, [widgetType]);

  const embedUrl = useMemo(() => {
    return `https://analytika.dev/embed/widget?site=${siteDomain}&type=${widgetType}&theme=${theme}&metric=${metric}&range=${timeRange}`;
  }, [siteDomain, widgetType, theme, metric, timeRange]);

  const badgeUrl = useMemo(() => {
    return `https://analytika.dev/badge/${siteDomain}/${metric}.svg?theme=${theme}`;
  }, [siteDomain, metric, theme]);

  // Generated Embed Code string for Clipboard
  const rawCodeToCopy = useMemo(() => {
    if (embedFormat === "iframe") {
      return `<iframe\n  src="${embedUrl}"\n  width="${widgetDimensions.width}"\n  height="${widgetDimensions.height}"\n  frameborder="0"\n  scrolling="no"\n  loading="lazy"\n  style="border-radius: 16px; border: ${
        theme === "dark"
          ? "1px solid rgba(255,255,255,0.08)"
          : theme === "light"
          ? "1px solid rgba(0,0,0,0.08)"
          : "none"
      };"\n></iframe>`;
    }

    if (embedFormat === "react") {
      return `import React from "react";\n\nexport function AnalytikaWidget() {\n  return (\n    <iframe\n      src="${embedUrl}"\n      width="${widgetDimensions.width}"\n      height="${widgetDimensions.height}"\n      className="rounded-2xl border ${
        theme === "dark" ? "border-white/[0.08]" : "border-black/[0.08]"
      }"\n      loading="lazy"\n    />\n  );\n}`;
    }

    return `[![${siteDomain} Analytics](${badgeUrl})](${publicShareUrl})`;
  }, [embedFormat, embedUrl, widgetDimensions, theme, siteDomain, badgeUrl, publicShareUrl]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(rawCodeToCopy);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicShareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#181818] border-white/[0.08] text-white max-w-4xl p-0 overflow-hidden shadow-2xl rounded-2xl">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#1F1F1F]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#800E13]/20 border border-[#800E13]/40 flex items-center justify-center text-rose-400 shrink-0">
              <Share2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                <span>Share & Embed Widgets</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400 mt-0.5">
                Embed live verified stats on your website or share a public link for <span className="font-mono text-zinc-200">{siteDomain}</span>.
              </DialogDescription>
            </div>
          </div>

          {/* Top Switcher */}
          <div className="flex items-center gap-1 bg-[#141414] p-1 rounded-xl border border-white/[0.06] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setModalTab("widget")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                modalTab === "widget"
                  ? "bg-[#262626] text-white shadow-sm border border-white/[0.08]"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Embed Widget
            </button>
            <button
              type="button"
              onClick={() => setModalTab("public-link")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                modalTab === "public-link"
                  ? "bg-[#262626] text-white shadow-sm border border-white/[0.08]"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Public Link
            </button>
          </div>
        </div>

        {/* TAB 1: EMBED WIDGET STUDIO */}
        {modalTab === "widget" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch">
            {/* Left Controls (5 cols) */}
            <div className="lg:col-span-5 p-5 space-y-4 border-b lg:border-b-0 lg:border-r border-white/[0.06] bg-[#1C1C1C]">
              {/* 1. Widget Style Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Widget Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "sparkline", label: "Snapshot Card", desc: "Trend graph & growth" },
                    { id: "live-pill", label: "Live Visitor Pill", desc: "Realtime online badge" },
                    { id: "kpi-card", label: "Open Proof Card", desc: "Multi-metric proof" },
                    { id: "github-badge", label: "README Badge", desc: "SVG Markdown badge" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setWidgetType(item.id as WidgetType)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        widgetType === item.id
                          ? "bg-[#2A2A2A] border-[#800E13] text-white shadow-sm ring-1 ring-[#800E13]/50"
                          : "bg-[#161616] border-white/[0.04] text-zinc-400 hover:text-zinc-200 hover:border-white/[0.08]"
                      }`}
                    >
                      <div className="text-xs font-semibold">{item.label}</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">{item.desc}</div>
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
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer text-center ${
                        theme === t
                          ? "bg-[#262626] text-white shadow-sm border border-white/[0.08]"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Metric & Range (When applicable) */}
              {widgetType !== "live-pill" && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Metric</label>
                    <Select value={metric} onValueChange={(val) => setMetric(val as any)}>
                      <SelectTrigger className="bg-[#161616] border-white/[0.08] text-white text-xs h-9">
                        <SelectValue placeholder="Metric" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visitors">Unique Visitors</SelectItem>
                        <SelectItem value="pageviews">Pageviews</SelectItem>
                        <SelectItem value="revenue">Revenue (MRR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Timeframe</label>
                    <Select value={timeRange} onValueChange={(val) => setTimeRange(val as any)}>
                      <SelectTrigger className="bg-[#161616] border-white/[0.08] text-white text-xs h-9">
                        <SelectValue placeholder="Timeframe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24h">Last 24 Hours</SelectItem>
                        <SelectItem value="7d">Last 7 Days</SelectItem>
                        <SelectItem value="30d">Last 30 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Verified Branding Indicator */}
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#141414] border border-white/[0.06]">
                <img src="/logo.svg" alt="Analytika" className="w-5 h-5 object-contain shrink-0" />
                <div className="text-[11px] text-zinc-300">
                  <span className="font-semibold text-white">Analytika Verified</span>
                  <p className="text-[10px] text-zinc-500">Every widget includes tamper-proof verification.</p>
                </div>
              </div>
            </div>

            {/* Right Preview & Code Column (7 cols) */}
            <div className="lg:col-span-7 p-5 flex flex-col space-y-4 bg-[#141414]">
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
                <div className="rounded-2xl bg-[#0B0B0B] border border-white/[0.06] p-5 flex items-center justify-center min-h-[155px] relative overflow-hidden bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:12px_12px] shadow-inner">
                  {/* TYPE 1: SNAPSHOT CARD (Sparkline) */}
                  {widgetType === "sparkline" && (
                    <div
                      className={`w-[310px] p-4 rounded-2xl transition-all shadow-xl flex flex-col justify-between ${
                        theme === "dark"
                          ? "bg-[#1E1E1E] border border-white/[0.08] text-white shadow-2xl"
                          : theme === "light"
                          ? "bg-white border border-black/[0.08] text-zinc-900 shadow-md"
                          : "bg-white/[0.06] backdrop-blur-xl text-white border border-white/[0.12]"
                      }`}
                    >
                      {/* Top Row: Domain Identity & Trend Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${siteDomain}&sz=64`}
                            alt=""
                            className="w-4 h-4 rounded-sm"
                          />
                          <span className="font-bold text-xs truncate max-w-[130px]">{siteDomain}</span>
                        </div>
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                          +24.8% ↑
                        </span>
                      </div>

                      {/* Middle Row: Big Number & Glowing Sparkline */}
                      <div className="flex items-end justify-between my-2">
                        <div>
                          <div className="text-2xl font-extrabold font-mono tracking-tight leading-none">
                            {metric === "visitors" ? "42,850" : metric === "pageviews" ? "128,400" : "$12,480"}
                          </div>
                          <div
                            className={`text-[10px] font-mono mt-1 ${
                              theme === "light" ? "text-zinc-500" : "text-zinc-400"
                            }`}
                          >
                            {metric === "visitors"
                              ? "Unique Visitors (30d)"
                              : metric === "pageviews"
                              ? "Page Views (30d)"
                              : "Attributed MRR"}
                          </div>
                        </div>

                        {/* Glowing Red Curve */}
                        <svg className="w-24 h-9 overflow-visible" viewBox="0 0 100 30">
                          <defs>
                            <linearGradient id="widgetGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#800E13" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="#800E13" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          <path
                            d="M 0 25 Q 20 28 40 16 T 70 12 T 90 6 L 100 4 L 100 30 L 0 30 Z"
                            fill="url(#widgetGrad)"
                          />
                          <path
                            d="M 0 25 Q 20 28 40 16 T 70 12 T 90 6 L 100 4"
                            fill="none"
                            stroke="#800E13"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>

                      {/* Bottom Row: Analytika Brand Verification */}
                      <div
                        className={`flex items-center justify-between pt-2 border-t text-[10px] font-mono ${
                          theme === "light" ? "border-zinc-100 text-zinc-500" : "border-white/[0.06] text-zinc-400"
                        }`}
                      >
                        <span className="text-[9px] text-zinc-500">Live Traffic</span>
                        <div className="flex items-center gap-1 font-semibold text-zinc-300">
                          <img src="/logo.svg" alt="" className="w-3.5 h-3.5 object-contain" />
                          <span>Analytika</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TYPE 2: LIVE VISITOR PILL */}
                  {widgetType === "live-pill" && (
                    <div
                      className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-mono transition-all shadow-xl ${
                        theme === "dark"
                          ? "bg-[#1E1E1E] border border-white/[0.08] text-white"
                          : theme === "light"
                          ? "bg-white border border-black/[0.08] text-zinc-900 shadow-md"
                          : "bg-white/[0.06] backdrop-blur-xl text-white border border-white/[0.12]"
                      }`}
                    >
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span className="font-extrabold text-sm text-white">{onlineCount}</span>
                      <span className={theme === "light" ? "text-zinc-500 text-[11px]" : "text-zinc-400 text-[11px]"}>
                        Live Visitors
                      </span>
                      <span className="h-3 w-px bg-white/10" />
                      <div className="flex items-center gap-1 font-bold text-white tracking-tight text-[11px]">
                        <img src="/logo.svg" alt="" className="w-3.5 h-3.5 object-contain" />
                        <span>Analytika</span>
                      </div>
                    </div>
                  )}

                  {/* TYPE 3: OPEN PROOF CARD */}
                  {widgetType === "kpi-card" && (
                    <div
                      className={`w-[310px] p-4 rounded-2xl transition-all shadow-xl space-y-3 ${
                        theme === "dark"
                          ? "bg-[#1E1E1E] border border-white/[0.08] text-white"
                          : theme === "light"
                          ? "bg-white border border-black/[0.08] text-zinc-900 shadow-md"
                          : "bg-white/[0.06] backdrop-blur-xl text-white border border-white/[0.12]"
                      }`}
                    >
                      <div className="flex items-center justify-between border-b pb-2.5 border-white/[0.06]">
                        <div className="flex items-center gap-1.5">
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${siteDomain}&sz=64`}
                            alt=""
                            className="w-3.5 h-3.5 rounded-sm"
                          />
                          <span className="font-bold text-xs truncate max-w-[130px]">{siteDomain}</span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Verified Live
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center font-mono">
                        <div
                          className={`p-2 rounded-xl ${
                            theme === "light" ? "bg-zinc-100" : "bg-[#141414] border border-white/[0.04]"
                          }`}
                        >
                          <div className="text-[9px] text-zinc-400 uppercase">Visitors</div>
                          <div className="text-xs font-bold mt-0.5">42.8k</div>
                        </div>
                        <div
                          className={`p-2 rounded-xl ${
                            theme === "light" ? "bg-zinc-100" : "bg-[#141414] border border-white/[0.04]"
                          }`}
                        >
                          <div className="text-[9px] text-zinc-400 uppercase">Bounce</div>
                          <div className="text-xs font-bold mt-0.5">38.4%</div>
                        </div>
                        <div
                          className={`p-2 rounded-xl ${
                            theme === "light" ? "bg-zinc-100" : "bg-[#141414] border border-white/[0.04]"
                          }`}
                        >
                          <div className="text-[9px] text-zinc-400 uppercase">Conv.</div>
                          <div className="text-xs font-bold mt-0.5">4.2%</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-zinc-400">
                        <span>Open Metrics</span>
                        <div className="flex items-center gap-1 text-white font-semibold">
                          <img src="/logo.svg" alt="" className="w-3.5 h-3.5 object-contain" />
                          <span>Analytika</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TYPE 4: GITHUB BADGE */}
                  {widgetType === "github-badge" && (
                    <div className="inline-flex rounded-lg overflow-hidden border border-white/[0.12] text-xs font-mono shadow-lg">
                      <div className="bg-[#1F1F1F] text-white px-3 py-1 flex items-center gap-1.5 font-bold text-[11px]">
                        <img src="/logo.svg" alt="" className="w-3.5 h-3.5 object-contain" />
                        <span>analytika</span>
                      </div>
                      <div className="bg-[#800E13] text-white px-3 py-1 font-extrabold text-[11px] tracking-tight">
                        42.8k visitors/mo
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Terminal Code Window with Syntax Highlighting */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  {/* Format Selector Pills */}
                  <div className="flex items-center gap-1 bg-[#1A1A1A] p-0.5 rounded-lg border border-white/[0.06]">
                    {(["iframe", "react", "markdown"] as EmbedFormat[]).map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setEmbedFormat(fmt)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors cursor-pointer ${
                          embedFormat === fmt ? "bg-[#800E13] text-white font-semibold" : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        {fmt === "iframe" ? "HTML <iframe>" : fmt === "react" ? "React" : "Markdown"}
                      </button>
                    ))}
                  </div>

                  <Button
                    size="sm"
                    onClick={handleCopyCode}
                    className="bg-[#800E13] hover:bg-[#800E13]/90 text-white text-xs h-7 px-3 cursor-pointer shadow-xs"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1 text-emerald-300" />
                        Copied Code
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        Copy Embed Code
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
                        {"  "}<span className="text-amber-300">style</span>=<span className="text-emerald-300">&quot;border-radius: 16px; border: {theme === "dark" ? "1px solid rgba(255,255,255,0.08)" : theme === "light" ? "1px solid rgba(0,0,0,0.08)" : "none"};&quot;</span>{"\n"}
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
        )}

        {/* TAB 2: PUBLIC DASHBOARD LINK */}
        {modalTab === "public-link" && (
          <div className="p-8 space-y-6 max-w-xl mx-auto flex flex-col justify-center">
            <div className="text-center space-y-1.5">
              <div className="w-14 h-14 rounded-2xl bg-[#800E13]/10 border border-[#800E13]/30 flex items-center justify-center mx-auto text-[#800E13] mb-2 shadow-inner">
                <Globe className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">Public Analytics Link</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Share view-only analytics with your community, customers, or investors without giving account access.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#141414] border border-white/[0.08] space-y-4 shadow-xl">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Public Dashboard URL</label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={publicShareUrl}
                    className="bg-[#1F1F1F] border-white/[0.08] text-zinc-200 text-xs font-mono select-all"
                  />
                  <Button
                    onClick={handleCopyLink}
                    className="bg-[#800E13] hover:bg-[#800E13]/90 text-white shrink-0 text-xs"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-300 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                    {copiedLink ? "Copied" : "Copy Link"}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/[0.04] text-xs">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Read-only view (Settings & credentials hidden)
                </span>
                <a
                  href={publicShareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-mono text-[11px]"
                >
                  Preview Link <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
