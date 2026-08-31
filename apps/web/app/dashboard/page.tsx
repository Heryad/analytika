"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Globe, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger 
} from "@/components/ui/dialog";

interface Website {
  id: string;
  domain: string;
  name: string;
  monthlyVisitors: number;
  monthlyRevenue: number;
  sparkline: number[];
}

// Smooth Number Counter Animation
function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1200; // 1.2s smooth ticker

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out exponential
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayValue(Math.floor(easeProgress * value));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    const animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [value]);

  return (
    <span>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}

// Smooth Bezier Spline Curve Interpolation
function getSmoothSpline(points: { x: number; y: number }[]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

  let d = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

function SparklineChart({ data, id }: { data: number[]; id: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(timer);
  }, []);

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 300;
  const height = 48;
  
  const pointCoords = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d - min) / range) * (height - 12) - 6;
    return { x, y };
  });

  const pathD = getSmoothSpline(pointCoords);
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

  return (
    <div className="w-full h-12 overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#800E13" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#800E13" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        
        {/* Animated Smooth Area Fill */}
        <path 
          d={areaD} 
          fill={`url(#grad-${id})`} 
          className={`transition-opacity duration-1000 ${mounted ? "opacity-100" : "opacity-0"}`} 
        />
        
        {/* Animated Smooth Spline Line */}
        <path 
          d={pathD} 
          fill="none" 
          stroke="#800E13" 
          strokeWidth="2.2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeDasharray="600"
          strokeDashoffset={mounted ? "0" : "600"}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
    </div>
  );
}

// Exact 1-to-1 Geometry Skeleton Card
function WebsiteCardSkeleton() {
  return (
    <div className="rounded-2xl bg-[#262626] border border-white/[0.08] p-5 shadow-sm animate-pulse h-[196px] flex flex-col justify-between">
      {/* Top Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-white/[0.08] shrink-0" />
          <div>
            <div className="h-4 w-28 bg-white/[0.08] rounded" />
            <div className="h-3 w-20 bg-white/[0.04] rounded mt-1" />
          </div>
        </div>
        <div className="w-4 h-4 rounded bg-white/[0.04] shrink-0" />
      </div>

      {/* Middle Row */}
      <div className="flex items-baseline justify-between pt-1">
        <div>
          <div className="h-2.5 w-16 bg-white/[0.04] rounded mb-1.5" />
          <div className="h-5 w-20 bg-white/[0.08] rounded" />
        </div>
        <div className="flex flex-col items-end">
          <div className="h-2.5 w-16 bg-white/[0.04] rounded mb-1.5" />
          <div className="h-5 w-16 bg-white/[0.08] rounded" />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="pt-1 border-t border-white/[0.04]">
        <div className="w-full h-12 rounded bg-white/[0.03]" />
      </div>
    </div>
  );
}

function WebsitesHub() {
  const searchParams = useSearchParams();
  const incomingDomain = searchParams.get("domain");

  const [isLoading, setIsLoading] = useState(true);
  const [websites, setWebsites] = useState<Website[]>([
    {
      id: "supadeploy",
      domain: "supadeploy.com",
      name: "SupaDeploy",
      monthlyVisitors: 48920,
      monthlyRevenue: 9840,
      // Hockey-stick viral breakout trajectory
      sparkline: [14, 18, 16, 26, 34, 48, 52, 68, 85, 115, 140, 180, 220, 265],
    },
    {
      id: "vectorflow",
      domain: "vectorflow.io",
      name: "VectorFlow",
      monthlyVisitors: 21450,
      monthlyRevenue: 4320,
      // Dynamic mid-month spike & high-volatility surge curve
      sparkline: [40, 48, 42, 95, 185, 140, 88, 105, 135, 190, 160, 210, 195, 230],
    },
    {
      id: "devpulse",
      domain: "devpulse.tools",
      name: "DevPulse Tools",
      monthlyVisitors: 12800,
      monthlyRevenue: 1950,
      // Consistent, gentle steady organic climb
      sparkline: [22, 25, 28, 30, 36, 40, 44, 49, 53, 58, 64, 70, 78, 86],
    },
  ]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newDomain, setNewDomain] = useState("");

  // Simulate fast realistic skeleton loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  // Auto-prompt add website if incoming domain is present
  useEffect(() => {
    if (incomingDomain && !websites.some((w) => w.domain.toLowerCase() === incomingDomain.toLowerCase())) {
      setNewDomain(incomingDomain);
      setIsAddOpen(true);
    }
  }, [incomingDomain]);

  const handleAddWebsite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;

    const cleaned = newDomain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    const generatedId = cleaned.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    const newSite: Website = {
      id: generatedId,
      domain: cleaned,
      name: cleaned.split(".")[0].charAt(0).toUpperCase() + cleaned.split(".")[0].slice(1),
      monthlyVisitors: 0,
      monthlyRevenue: 0,
      sparkline: [5, 8, 6, 10, 12, 15, 14, 18, 20, 22, 25, 28, 30, 35],
    };

    setWebsites([newSite, ...websites]);
    setNewDomain("");
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Clean Header: Title + Add Website Button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Websites
        </h1>

        <Button
          asChild
          className="bg-[#800E13] hover:bg-[#9e1218] text-white font-medium text-xs sm:text-sm px-4 h-10 rounded-xl transition-all border border-[#800E13] shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Link href="/dashboard/new">
            <Plus className="h-4 w-4" />
            Add Website
          </Link>
        </Button>
      </div>

      {/* Websites Grid with 1:1 Skeleton & Animated Reveal */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <>
            <WebsiteCardSkeleton />
            <WebsiteCardSkeleton />
            <WebsiteCardSkeleton />
          </>
        ) : (
          websites.map((site) => (
            <Link
              key={site.id}
              href={`/dashboard/${site.id}`}
              className="group rounded-2xl bg-[#262626] border border-white/[0.08] hover:border-[#800E13]/60 hover:bg-[#2a2a2a] hover:scale-[1.018] hover:shadow-xl hover:shadow-black/40 transition-all duration-300 ease-out p-5 cursor-pointer animate-in fade-in h-[196px] flex flex-col justify-between"
            >
              
              {/* Top Row: Direct Favicon + Title + Arrow */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${site.domain}&sz=64`}
                    alt={site.domain}
                    className="w-6 h-6 object-contain shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  <div>
                    <h2 className="text-base font-bold text-white group-hover:text-rose-200 transition-colors leading-tight">
                      {site.name}
                    </h2>
                    <span className="text-xs text-zinc-500 font-mono block mt-0.5 leading-none">
                      {site.domain}
                    </span>
                  </div>
                </div>

                <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-rose-300 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>

              {/* Middle Row: Key Stats with Smooth Animated Ticker */}
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block leading-none mb-1.5">
                    Visitors (30d)
                  </span>
                  <span className="text-xl font-bold font-mono text-white tracking-tight leading-none block">
                    <AnimatedNumber value={site.monthlyVisitors} />
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block leading-none mb-1.5">
                    Revenue (30d)
                  </span>
                  <span className="text-xl font-bold font-mono text-rose-300 tracking-tight leading-none block">
                    <AnimatedNumber value={site.monthlyRevenue} prefix="$" />
                  </span>
                </div>
              </div>

              {/* Bottom Row: Embedded Animated Sparkline Chart */}
              <div className="pt-1 border-t border-white/[0.04]">
                <SparklineChart data={site.sparkline} id={site.id} />
              </div>

            </Link>
          ))
        )}
      </div>

    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <WebsiteCardSkeleton />
        <WebsiteCardSkeleton />
        <WebsiteCardSkeleton />
      </div>
    }>
      <WebsitesHub />
    </Suspense>
  );
}
