"use client";

import Image from "next/image";
import { LayoutDashboard } from "lucide-react";

export function InteractivePreview() {
  return (
    <section id="preview" className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 mb-20 scroll-mt-24">
      {/* Clean Demo / Dashboard Mockup Placeholder */}
      <div className="relative rounded-2xl bg-[#262626] border border-white/[0.08] p-3 sm:p-4 shadow-xl overflow-hidden group">
        
        {/* Browser Top Chrome Bar */}
        <div className="flex items-center justify-between pb-3 px-2 border-b border-white/[0.06] mb-3">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#383838]" />
            <span className="h-3 w-3 rounded-full bg-[#383838]" />
            <span className="h-3 w-3 rounded-full bg-[#383838]" />
          </div>
          <div className="rounded-md bg-[#1F1F1F] px-4 py-1 text-xs text-zinc-400 font-mono border border-white/[0.04]">
            analytika.me/dashboard
          </div>
          <div className="w-10" />
        </div>

        {/* Inner Placeholder Area */}
        <div className="relative aspect-[16/9] w-full rounded-xl bg-[#1c1c1c] border border-white/[0.04] flex flex-col items-center justify-center text-center p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#262626] border border-white/[0.08] text-rose-300 mb-3 shadow-sm">
            <LayoutDashboard className="h-6 w-6 text-[#800E13]" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">
            Dashboard Preview
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm">
            Live real-time visitors, revenue attribution metrics, and conversion funnel analytics.
          </p>
        </div>

      </div>
    </section>
  );
}
