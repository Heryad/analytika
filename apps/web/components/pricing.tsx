"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, X, ArrowRight, Sparkles } from "lucide-react";

// Flicker-free smooth animated counting number component
function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const currentRef = useRef(value);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (currentRef.current === value) return;

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    const start = currentRef.current;
    const end = value;
    const startTime = performance.now();
    const duration = 280;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * ease);

      currentRef.current = current;
      setDisplayValue(current);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [value]);

  return <span className="tabular-nums font-mono inline-block">{displayValue.toLocaleString()}</span>;
}

export function Pricing() {
  const [annual, setAnnual] = useState(true);
  const [sliderIndex, setSliderIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // 6 Clean Stages (10K to 20M)
  const tiers = [
    { events: 10_000, label: "10k", starterM: 9, starterA: 7, proM: 19, proA: 15 },
    { events: 100_000, label: "100k", starterM: 19, starterA: 15, proM: 39, proA: 31 },
    { events: 500_000, label: "500k", starterM: 49, starterA: 39, proM: 89, proA: 71 },
    { events: 2_000_000, label: "2m", starterM: 119, starterA: 95, proM: 189, proA: 151 },
    { events: 5_000_000, label: "5m", starterM: 199, starterA: 159, proM: 299, proA: 239 },
    { events: 20_000_000, label: "20m", starterM: 499, starterA: 399, proM: 699, proA: 559 },
  ];

  const current = tiers[sliderIndex];
  const starterPrice = annual ? current.starterA : current.starterM;
  const proPrice = annual ? current.proA : current.proM;

  // Visual percentage with a clear 16% prefill at 10K up to 100% at 20M
  const visualPercentage = 16 + (sliderIndex / (tiers.length - 1)) * 84;

  const updateStageFromPointer = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const rawRatio = (clientX - rect.left) / rect.width;
    const clamped = Math.max(0, Math.min(1, rawRatio));
    
    // Map ratio cleanly to the 6 stages
    const stepCount = tiers.length - 1;
    let index = 0;
    if (clamped > 0.1) {
      index = Math.round(((clamped - 0.16) / 0.84) * stepCount);
      index = Math.max(0, Math.min(stepCount, index));
    }
    setSliderIndex(index);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateStageFromPointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updateStageFromPointer(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <section id="pricing" className="py-20 relative scroll-mt-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-300 mb-2">
            Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
            Pay Only for the Traffic You Track
          </h2>
          <p className="text-zinc-400 text-sm">
            14-day free trial on all plans • No credit card required • Cancel anytime
          </p>
        </div>

        {/* Cardless Single-Row Controls: Perfectly Aligned Slider + 10K/20M + Monthly Switcher */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 w-full select-none">

          {/* Slider Row: 10K - Track - 20M all centered on the exact same row */}
          <div className="flex-1 w-full flex items-center gap-4">
            <span className="text-xs font-mono text-zinc-400 font-semibold shrink-0 select-none">
              10K
            </span>

            {/* Interactive Slider Container with pointer capture */}
            <div 
              ref={trackRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="relative flex-1 flex items-center h-8 cursor-pointer touch-none"
            >

              {/* Floating Tooltip directly above thumb */}
              <div
                className="absolute -top-9 -translate-x-1/2 transition-all duration-100 ease-out pointer-events-none z-20"
                style={{ left: `${visualPercentage}%` }}
              >
                <div className="bg-[#800E13] text-white text-xs font-mono font-bold px-2.5 py-0.5 rounded shadow-lg whitespace-nowrap border border-white/[0.1] relative after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-[#800E13]">
                  Up to {current.label.toLowerCase()} events
                </div>
              </div>

              {/* The Actual Track Bar (Taller & Thicker) */}
              <div className="relative w-full h-3.5 rounded-full bg-[#262626] border border-white/[0.08] flex items-center overflow-visible">
                {/* Filled Gradient Bar (16% pre-filled at 10K) */}
                <div
                  className="h-full bg-gradient-to-r from-[#800E13] via-[#9e1218] to-[#be123c] rounded-full transition-all duration-100"
                  style={{ width: `${visualPercentage}%` }}
                />

                {/* Visible Circle Handle Centered Exactly on the Track Bar */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border-4 border-[#800E13] shadow-[0_0_14px_rgba(128,14,19,0.9)] pointer-events-none transition-all duration-100 z-10"
                  style={{ left: `${visualPercentage}%` }}
                />
              </div>

            </div>

            <span className="text-xs font-mono text-zinc-400 font-semibold shrink-0 select-none">
              20M
            </span>
          </div>

          {/* Monthly / Annual Switcher in the same row */}
          <div className="inline-flex items-center gap-1 rounded-lg bg-[#262626] p-1 border border-white/[0.08] shrink-0">
            <button
              onClick={() => setAnnual(false)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                !annual ? "bg-[#800E13] text-white shadow-xs" : "text-zinc-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                annual ? "bg-[#800E13] text-white shadow-xs" : "text-zinc-400 hover:text-white"
              }`}
            >
              Annual
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                Save 20%
              </span>
            </button>
          </div>

        </div>

        {/* 2 Compact Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">

          {/* 1. Starter Plan */}
          <div className="flex flex-col justify-between rounded-xl bg-[#262626] border border-white/[0.08] p-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-white">Starter</h3>
                <span className="text-[11px] font-mono text-zinc-400 bg-[#1F1F1F] px-2 py-0.5 rounded border border-white/[0.06]">
                  Solo Founders
                </span>
              </div>
              <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
                Core analytics for single websites, indie products, and side projects.
              </p>

              {/* Animated Price */}
              <div className="mb-5 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white tracking-tight">
                  $<AnimatedNumber value={starterPrice} />
                </span>
                <span className="text-xs text-zinc-400">
                  / month {annual && <span className="text-[10px] text-zinc-500">(billed annually)</span>}
                </span>
              </div>

              {/* Features List with Animated Event Counter */}
              <div className="pt-4 border-t border-white/[0.06] space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Check className="h-3.5 w-3.5 text-[#800E13] shrink-0" />
                  <span><strong><AnimatedNumber value={current.events} /></strong> monthly events</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <Check className="h-3.5 w-3.5 text-[#800E13] shrink-0" />
                  <span><strong>1 tracked website</strong></span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <Check className="h-3.5 w-3.5 text-[#800E13] shrink-0" />
                  <span>Real-time live visitor pulse</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <Check className="h-3.5 w-3.5 text-[#800E13] shrink-0" />
                  <span>Declarative HTML goal tracking</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <Check className="h-3.5 w-3.5 text-[#800E13] shrink-0" />
                  <span>30-day data retention</span>
                </div>

                {/* Excluded items */}
                <div className="flex items-center gap-2 text-zinc-500">
                  <X className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                  <span>No MCP (Model Context Protocol) AI</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-500">
                  <X className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                  <span>No revenue attribution webhooks</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-500">
                  <X className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                  <span>No conversion funnels</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Button
                className="w-full bg-[#1F1F1F] hover:bg-[#222222] text-white border border-white/[0.1] font-semibold h-10 text-xs"
                asChild
              >
                <Link href="/auth/login">
                  Start 14-Day Free Trial
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>

          {/* 2. Pro Plan (Highlighted) */}
          <div className="relative flex flex-col justify-between rounded-xl bg-[#262626] border-2 border-[#800E13] p-6 shadow-lg">

            {/* Highlight Pill */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-[#800E13] text-white font-semibold text-[11px] px-2.5 py-0.5 rounded-full border border-[#800E13]/60 shadow-xs flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Most Popular
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-white">Pro</h3>
                <span className="text-[11px] font-mono text-rose-300 bg-[#800E13]/20 px-2 py-0.5 rounded border border-[#800E13]/30">
                  Scale & Revenue
                </span>
              </div>
              <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
                Full power with MCP AI server, revenue attribution, and unlimited websites.
              </p>

              {/* Animated Price */}
              <div className="mb-5 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white tracking-tight">
                  $<AnimatedNumber value={proPrice} />
                </span>
                <span className="text-xs text-zinc-400">
                  / month {annual && <span className="text-[10px] text-zinc-500">(billed annually)</span>}
                </span>
              </div>

              {/* Features List with Animated Event Counter */}
              <div className="pt-4 border-t border-white/[0.06] space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-zinc-200 font-medium">
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span><strong><AnimatedNumber value={current.events} /></strong> monthly events</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-200 font-medium">
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span><strong>Unlimited tracked websites</strong></span>
                </div>
                <div className="flex items-center gap-2 text-zinc-200 font-medium">
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span><strong>MCP (Model Context Protocol) AI Server</strong></span>
                </div>
                <div className="flex items-center gap-2 text-zinc-200">
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Direct revenue attribution (Polar & Stripe)</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-200">
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Multi-step conversion funnels</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-200">
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>2-year data retention & ClickHouse export</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-200">
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Priority event ingestion</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-200">
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Priority founder support</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Button
                className="w-full bg-[#800E13] hover:bg-[#9e1218] text-white border border-[#800E13] font-semibold h-10 text-xs shadow-sm"
                asChild
              >
                <Link href="/auth/login">
                  Start 14-Day Pro Trial
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
