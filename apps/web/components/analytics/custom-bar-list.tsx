"use client";

import React from "react";
import { 
  Globe, Megaphone, Mail, Twitter, Facebook, Search, Link, 
  Monitor, Smartphone, Tablet, MousePointerClick, CreditCard, 
  Download, Play, ShoppingCart, Zap, FileText, Sparkles, Activity, RotateCcw
} from "lucide-react";

interface BarListItem {
  name: string;
  views: number;
  percentage: number;
  domain?: string | null;
  lucide?: string;
  code?: string;
}

interface CustomBarListProps {
  data: BarListItem[];
  type: "referrer" | "campaign" | "tech" | "location" | "event" | "page";
}

const BRAND_COLORS = [
  "#4285F4", // Google Blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#6366F1", // Indigo
  "#EC4899", // Pink
  "#8B5CF6", // Violet
  "#14B8A6", // Teal
  "#F43F5E", // Rose
];

export function CustomBarList({ data, type }: CustomBarListProps) {
  
  const getIcon = (item: BarListItem) => {
    if (type === "page") {
      return <FileText className="w-4 h-4 text-zinc-400 shrink-0" />;
    }

    if (type === "location" && item.code) {
      return (
        <img 
          src={`https://flagcdn.com/w40/${item.code.toLowerCase()}.png`} 
          alt={item.code}
          className="w-5 h-3.5 object-cover rounded-sm shadow-sm shrink-0"
        />
      );
    }

    if (type === "referrer" || (type === "tech" && item.domain)) {
      const fetchDomain = item.domain || item.name;
      return (
        <img 
          src={`https://www.google.com/s2/favicons?domain=${fetchDomain}&sz=128`} 
          alt={item.name} 
          className="w-5 h-5 object-contain shrink-0 rounded-sm"
        />
      );
    }

    if (item.lucide) {
      if (item.lucide === "Monitor") return <Monitor className="w-4 h-4 text-zinc-400 shrink-0" />;
      if (item.lucide === "Smartphone") return <Smartphone className="w-4 h-4 text-zinc-400 shrink-0" />;
      if (item.lucide === "Tablet") return <Tablet className="w-4 h-4 text-zinc-400 shrink-0" />;
      if (item.lucide === "MousePointerClick") return <MousePointerClick className="w-4 h-4 text-rose-400 shrink-0" />;
      if (item.lucide === "CreditCard") return <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />;
      if (item.lucide === "Download") return <Download className="w-4 h-4 text-blue-400 shrink-0" />;
      if (item.lucide === "Play") return <Play className="w-4 h-4 text-amber-400 shrink-0" />;
      if (item.lucide === "ShoppingCart") return <ShoppingCart className="w-4 h-4 text-purple-400 shrink-0" />;
      if (item.lucide === "Mail") return <Mail className="w-4 h-4 text-indigo-400 shrink-0" />;
      if (item.lucide === "Zap") return <Zap className="w-4 h-4 text-yellow-400 shrink-0" />;
      if (item.lucide === "FileText") return <FileText className="w-4 h-4 text-cyan-400 shrink-0" />;
      if (item.lucide === "Sparkles") return <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />;
      if (item.lucide === "RotateCcw") return <RotateCcw className="w-4 h-4 text-emerald-400 shrink-0" />;
    }

    if (type === "event") {
      return <Activity className="w-4 h-4 text-rose-400 shrink-0" />;
    }

    // For campaigns, do some string matching to find a nice icon
    const lowerName = item.name.toLowerCase();
    if (lowerName.includes("email") || lowerName.includes("newsletter")) return <Mail className="w-5 h-5 text-zinc-400" />;
    if (lowerName.includes("twitter")) return <Twitter className="w-5 h-5 text-[#1DA1F2]" />;
    if (lowerName.includes("fb") || lowerName.includes("facebook")) return <Facebook className="w-5 h-5 text-[#1877F2]" />;
    if (lowerName.includes("google") || lowerName.includes("cpc")) return <Search className="w-5 h-5 text-[#4285F4]" />;
    if (lowerName.includes("social")) return <Link className="w-5 h-5 text-zinc-400" />;
    return <Megaphone className="w-5 h-5 text-zinc-400" />;
  };

  const formatName = (name: string) => {
    if (type === "referrer") return name;
    
    // Clean up campaign names, e.g. "summer_sale (google / cpc)"
    const match = name.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
      return (
        <div className="flex items-center gap-2">
          <span className="font-medium text-zinc-200">{match[1]}</span>
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 bg-white/[0.04] px-1.5 py-0.5 rounded-sm border border-white/[0.04]">{match[2]}</span>
        </div>
      );
    }
    return <span className="font-medium text-zinc-200">{name}</span>;
  };

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 select-none">
        <Activity className="w-6 h-6 mb-2 opacity-30 text-zinc-400" />
        <p className="text-xs font-mono">No data recorded for this period</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col gap-4 overflow-y-scroll custom-scrollbar pr-3 pb-2 pt-1">
      {data.map((item, index) => {
        const color = BRAND_COLORS[index % BRAND_COLORS.length];
        
        return (
          <div key={item.name} className="flex flex-col gap-2 group cursor-pointer">
            {/* Header Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 flex items-center justify-center">
                  {getIcon(item)}
                </div>
                <div className="text-[13px]">{formatName(item.name)}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-bold text-white font-mono">{item.views.toLocaleString()}</span>
                <span className="text-[11px] text-zinc-500 w-8 text-right font-medium">{item.percentage}%</span>
              </div>
            </div>
            
            {/* Full Width Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden shadow-inner">
              <div 
                className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                style={{ 
                  width: mounted ? `${item.percentage}%` : "0%",
                  backgroundColor: color
                }}
              >
                {/* Shine effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
