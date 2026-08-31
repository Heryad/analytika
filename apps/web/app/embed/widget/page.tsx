"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function WidgetView() {
  const searchParams = useSearchParams();
  const site = searchParams.get("site") || "analytika.dev";
  const type = searchParams.get("type") || "sparkline";
  const theme = searchParams.get("theme") || "dark";
  const metric = searchParams.get("metric") || "visitors";
  const timeRange = searchParams.get("range") || "30d";

  const isLight = theme === "light";
  const isTransparent = theme === "transparent";

  // TYPE 1: LIVE VISITOR PILL
  if (type === "live-pill") {
    return (
      <div className="flex items-center justify-center min-h-screen p-2 bg-transparent">
        <a
          href={`https://analytika.dev/share/${site}`}
          target="_blank"
          rel="noreferrer"
          className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-mono transition-all shadow-xl hover:scale-105 active:scale-95 ${
            isLight
              ? "bg-white border border-black/[0.08] text-zinc-900 shadow-md"
              : isTransparent
              ? "bg-white/[0.06] backdrop-blur-xl text-white border border-white/[0.12]"
              : "bg-[#1E1E1E] border border-white/[0.08] text-white"
          }`}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-extrabold text-sm text-white">14</span>
          <span className={isLight ? "text-zinc-500 text-[11px]" : "text-zinc-400 text-[11px]"}>
            Live Visitors
          </span>
          <span className="h-3 w-px bg-white/10" />
          <div className="flex items-center gap-1 font-bold text-white tracking-tight text-[11px]">
            <img src="/logo.svg" alt="Analytika" className="w-3.5 h-3.5 object-contain" />
            <span>Analytika</span>
          </div>
        </a>
      </div>
    );
  }

  // TYPE 2: OPEN PROOF CARD
  if (type === "kpi-card") {
    return (
      <div className="flex items-center justify-center min-h-screen p-2 bg-transparent font-sans">
        <div
          className={`w-full max-w-[340px] p-4 rounded-2xl transition-all shadow-xl space-y-3 ${
            isLight
              ? "bg-white border border-black/[0.08] text-zinc-900 shadow-md"
              : isTransparent
              ? "bg-white/[0.06] backdrop-blur-xl text-white border border-white/[0.12]"
              : "bg-[#1E1E1E] border border-white/[0.08] text-white"
          }`}
        >
          <div className="flex items-center justify-between border-b pb-2.5 border-white/[0.06]">
            <div className="flex items-center gap-1.5">
              <img
                src={`https://www.google.com/s2/favicons?domain=${site}&sz=64`}
                alt=""
                className="w-3.5 h-3.5 rounded-sm"
              />
              <span className="font-bold text-xs truncate max-w-[140px]">{site}</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Verified Live
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <div
              className={`p-2 rounded-xl ${
                isLight ? "bg-zinc-100" : "bg-[#141414] border border-white/[0.04]"
              }`}
            >
              <div className="text-[9px] text-zinc-400 uppercase">Visitors</div>
              <div className="text-xs font-bold mt-0.5">42.8k</div>
            </div>
            <div
              className={`p-2 rounded-xl ${
                isLight ? "bg-zinc-100" : "bg-[#141414] border border-white/[0.04]"
              }`}
            >
              <div className="text-[9px] text-zinc-400 uppercase">Bounce</div>
              <div className="text-xs font-bold mt-0.5">38.4%</div>
            </div>
            <div
              className={`p-2 rounded-xl ${
                isLight ? "bg-zinc-100" : "bg-[#141414] border border-white/[0.04]"
              }`}
            >
              <div className="text-[9px] text-zinc-400 uppercase">Conv.</div>
              <div className="text-xs font-bold mt-0.5">4.2%</div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-zinc-400">
            <span>Open Metrics</span>
            <a
              href={`https://analytika.dev/share/${site}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-white font-semibold hover:underline"
            >
              <img src="/logo.svg" alt="Analytika" className="w-3.5 h-3.5 object-contain" />
              <span>Analytika</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // TYPE 3: SNAPSHOT CARD (Default)
  return (
    <div className="flex items-center justify-center min-h-screen p-2 bg-transparent font-sans">
      <div
        className={`w-full max-w-[340px] p-4 rounded-2xl transition-all shadow-xl flex flex-col justify-between ${
          isLight
            ? "bg-white border border-black/[0.08] text-zinc-900 shadow-md"
            : isTransparent
            ? "bg-white/[0.06] backdrop-blur-xl text-white border border-white/[0.12]"
            : "bg-[#1E1E1E] border border-white/[0.08] text-white shadow-2xl"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={`https://www.google.com/s2/favicons?domain=${site}&sz=64`}
              alt=""
              className="w-4 h-4 rounded-sm"
            />
            <span className="font-bold text-xs truncate max-w-[140px]">{site}</span>
          </div>
          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            +24.8% ↑
          </span>
        </div>

        <div className="flex items-end justify-between my-2">
          <div>
            <div className="text-2xl font-extrabold font-mono tracking-tight leading-none">
              {metric === "visitors" ? "42,850" : metric === "pageviews" ? "128,400" : "$12,480"}
            </div>
            <div
              className={`text-[10px] font-mono mt-1 ${
                isLight ? "text-zinc-500" : "text-zinc-400"
              }`}
            >
              {metric === "visitors"
                ? "Unique Visitors (30d)"
                : metric === "pageviews"
                ? "Page Views (30d)"
                : "Attributed MRR"}
            </div>
          </div>

          <svg className="w-24 h-9 overflow-visible" viewBox="0 0 100 30">
            <defs>
              <linearGradient id="widgetGradEmbed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#800E13" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#800E13" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d="M 0 25 Q 20 28 40 16 T 70 12 T 90 6 L 100 4 L 100 30 L 0 30 Z"
              fill="url(#widgetGradEmbed)"
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

        <div
          className={`flex items-center justify-between pt-2 border-t text-[10px] font-mono ${
            isLight ? "border-zinc-100 text-zinc-500" : "border-white/[0.06] text-zinc-400"
          }`}
        >
          <span className="text-[9px] text-zinc-500">Live Traffic</span>
          <a
            href={`https://analytika.dev/share/${site}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 font-semibold text-zinc-300 hover:underline"
          >
            <img src="/logo.svg" alt="Analytika" className="w-3.5 h-3.5 object-contain" />
            <span>Analytika</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default function StandaloneWidgetPage() {
  return (
    <Suspense fallback={<div className="text-zinc-500 text-xs font-mono p-4">Loading widget...</div>}>
      <WidgetView />
    </Suspense>
  );
}
