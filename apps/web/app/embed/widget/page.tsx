"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { WebsiteFavicon } from "@/components/website-favicon";

function WidgetView() {
  const searchParams = useSearchParams();
  const siteParam = searchParams.get("id") || searchParams.get("site") || "analytika.me";
  const widgetType = (searchParams.get("type") as "sparkline" | "live-pill") || "sparkline";
  const theme = (searchParams.get("theme") as "dark" | "light" | "transparent") || "dark";
  const chartColor = searchParams.get("color") || "#800E13";
  const metric = (searchParams.get("metric") as "visitors" | "pageviews" | "revenue") || "visitors";
  const timeRange = (searchParams.get("range") as "24h" | "7d" | "30d") || "30d";

  const [siteDomain, setSiteDomain] = useState(siteParam);
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [metricValue, setMetricValue] = useState<string>("");
  const [sparkPath, setSparkPath] = useState<string>("M 0 35 L 200 35");

  // Metric Labels
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

  // If siteParam is a website ID (not a domain), resolve the real domain first
  useEffect(() => {
    if (!siteParam) return;

    // If it already looks like a domain (has a dot), use it directly
    if (siteParam.includes(".")) {
      setSiteDomain(siteParam);
      return;
    }

    // Otherwise fetch the public website metadata to resolve the real domain
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://api.analytika.me";
    fetch(`${apiBase}/api/v1/websites/${siteParam}/public`, { credentials: "omit" })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.website?.domain) {
          setSiteDomain(data.website.domain);
        }
      })
      .catch(() => {});
  }, [siteParam]);

  // Fetch live metrics (unauthenticated — works for isPublic=true websites)
  useEffect(() => {
    if (!siteParam) return;

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://api.analytika.me";

    const publicFetch = (endpoint: string) =>
      fetch(`${apiBase}${endpoint}`, { credentials: "omit" }).then((r) => r.json());

    if (widgetType === "live-pill") {
      publicFetch(`/api/v1/analytics/${siteParam}/live`)
        .then((res) => {
          if (res.success && typeof res.onlineVisitors === "number") {
            setOnlineCount(res.onlineVisitors);
          }
        })
        .catch(() => {});
      return;
    }

    // Sparkline widget: fetch overview & timeseries without auth
    publicFetch(`/api/v1/analytics/${siteParam}/overview?range=${timeRange}`)
      .then((res) => {
        if (res.success && res.metrics) {
          if (metric === "visitors") {
            setMetricValue(res.metrics.visitors.toLocaleString());
          } else if (metric === "pageviews") {
            setMetricValue(res.metrics.pageviews.toLocaleString());
          } else if (metric === "revenue") {
            setMetricValue(`$${res.metrics.revenue.toLocaleString()}`);
          }
        }
      })
      .catch(() => {});

    publicFetch(`/api/v1/analytics/${siteParam}/timeseries?range=${timeRange}`)
      .then((res) => {
        if (res.success && Array.isArray(res.timeseries) && res.timeseries.length > 2) {
          const vals = res.timeseries.map((pt: any) => {
            if (metric === "visitors") return pt.visitors;
            if (metric === "pageviews") return pt.pageviews;
            return pt.revenue;
          });
          const max = Math.max(...vals, 1);
          const min = Math.min(...vals, 0);
          const rangeVal = max - min || 1;

          const points = vals.map((v: number, i: number) => {
            const x = (i / (vals.length - 1)) * 200;
            const y = 35 - ((v - min) / rangeVal) * 30;
            return { x, y };
          });

          // Generate smoothed SVG spline
          let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
          for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const cx = (prev.x + curr.x) / 2;
            d += ` Q ${prev.x.toFixed(1)} ${prev.y.toFixed(1)} ${cx.toFixed(1)} ${((prev.y + curr.y) / 2).toFixed(1)}`;
          }
          const last = points[points.length - 1];
          d += ` T ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
          setSparkPath(d);
        }
      })
      .catch(() => {});
  }, [siteParam, widgetType, metric, timeRange]);

  const displayCount = metricValue || (metric === "revenue" ? "$0" : "0");
  const activePath = sparkPath || "M 0 35 L 200 35";

  const referrerDomain = siteDomain || siteParam || "unknown";
  const baseUrl = typeof window !== "undefined" && window.location.origin ? window.location.origin : "https://analytika.me";
  const landingUrl = `${baseUrl}/?ref=${encodeURIComponent(referrerDomain)}&utm_source=embed_widget&utm_medium=referral&utm_campaign=${encodeURIComponent(referrerDomain)}`;

  // TYPE 1: LIVE VISITOR PILL
  if (widgetType === "live-pill") {
    return (
      <div className="w-fit h-fit p-1 bg-transparent select-none">
        <a
          href={landingUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={`Powered by Analytika — live analytics for ${siteDomain}`}
          className={`inline-flex items-center gap-3 px-4 py-2 rounded-full transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer ${
            theme === "dark"
              ? "bg-[#181818] border border-white/[0.08] text-white shadow-black/80"
              : theme === "light"
              ? "bg-white border border-black/[0.08] text-zinc-900 shadow-lg shadow-black/5"
              : "bg-white/[0.08] backdrop-blur-xl text-white border border-white/[0.15] shadow-lg"
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
            <WebsiteFavicon
              domain={siteDomain}
              className="w-3.5 h-3.5 rounded-xs object-contain"
            />
            <span className={`font-mono text-[11px] font-medium truncate max-w-[120px] ${theme === "light" ? "text-zinc-800" : "text-zinc-300"}`}>
              {siteDomain}
            </span>
          </div>
        </a>
      </div>
    );
  }

  // TYPE 2: SPARKLINE SNAPSHOT CARD (Exact match to ShareWidgetModal)
  return (
    <div className="w-fit h-fit p-1 bg-transparent select-none font-sans">
      <div
        className={`w-[300px] p-4 rounded-2xl transition-all shadow-lg flex flex-col justify-between ${
          theme === "dark"
            ? "bg-[#181818] border border-white/[0.08] text-white shadow-black/80"
            : theme === "light"
            ? "bg-white border border-black/[0.08] text-zinc-900 shadow-md shadow-black/5"
            : "bg-white/[0.06] backdrop-blur-xl text-white border border-white/[0.12] shadow-lg"
        }`}
      >
        {/* Top & Middle: Clickable snapshot area pointing to landing page with ref */}
        <a
          href={landingUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={`Powered by Analytika — analytics for ${siteDomain}`}
          className="group block cursor-pointer transition-opacity hover:opacity-90"
        >
          {/* Top Row: Domain Identity */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WebsiteFavicon
                domain={siteDomain}
                className="w-4 h-4 rounded-xs object-contain"
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
                <path d={`${activePath} L 200 40 L 0 40 Z`} fill="url(#widgetSparkGrad)" />
                {/* Spline Stroke */}
                <path
                  d={activePath}
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
        </a>

        {/* Bottom Row: Analytika Brand Link with ref */}
        <div
          className={`pt-2 border-t flex items-center justify-between ${
            theme === "light" ? "border-black/[0.08]" : "border-white/[0.08]"
          }`}
        >
          <a
            href={landingUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Analytika Privacy-Friendly Web Analytics"
            className="flex items-center gap-1.5 transition-opacity hover:opacity-80 cursor-pointer"
          >
            <Image
              src="/logo.svg"
              alt="Analytika Logo"
              width={14}
              height={14}
              className="w-3.5 h-3.5 object-contain"
            />
            <span
              className={`text-[11px] font-bold tracking-tight ${
                theme === "light" ? "text-zinc-900" : "text-white"
              }`}
            >
              Analytika
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default function StandaloneWidgetPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen p-4 bg-transparent text-zinc-500 text-xs font-mono">
          Loading widget...
        </div>
      }
    >
      <WidgetView />
    </Suspense>
  );
}
