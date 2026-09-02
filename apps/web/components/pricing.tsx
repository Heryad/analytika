"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, X, ArrowRight, Sparkles } from "lucide-react";
import { plansApi, PricingTier, PlanFeatureConfig } from "@/lib/api";

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
  const [plans, setPlans] = useState<Record<"solo" | "growth", PlanFeatureConfig> | null>(null);
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [annual, setAnnual] = useState(true);
  const [sliderIndex, setSliderIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // Load live tiers and plan features directly from backend API
  useEffect(() => {
    plansApi.get().then((res) => {
      if (res.success) {
        if (res.tiers && res.tiers.length > 0) setTiers(res.tiers);
        if (res.plans) setPlans(res.plans);
      }
    }).catch((err) => {
      console.error("Failed to load pricing from API:", err);
    });
  }, []);

  const current = tiers[sliderIndex] || {
    events: 10000,
    label: "10k",
    soloMonthly: 7,
    soloAnnual: 5.5,
    growthMonthly: 15,
    growthAnnual: 12,
  };

  const soloPrice = annual ? current.soloAnnual : current.soloMonthly;
  const growthPrice = annual ? current.growthAnnual : current.growthMonthly;
  const stepCount = Math.max(1, tiers.length - 1);
  const visualPercentage = 16 + (sliderIndex / stepCount) * 84;

  const updateStageFromPointer = (clientX: number) => {
    if (!trackRef.current || tiers.length <= 1) return;
    const rect = trackRef.current.getBoundingClientRect();
    const rawRatio = (clientX - rect.left) / rect.width;
    const clamped = Math.max(0, Math.min(1, rawRatio));
    
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
            Simple, Transparent, Value-Driven Pricing
          </h2>
          <p className="text-zinc-400 text-sm">
            14-day Solo trial activated on signup • No credit card required • Cancel anytime
          </p>
        </div>

        {/* Cardless Single-Row Controls: Slider + 10K/20M + Monthly/Annual Switcher */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 w-full select-none">

          {/* Slider Row: 10K - Track - 20M */}
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

              {/* The Actual Track Bar */}
              <div className="relative w-full h-3.5 rounded-full bg-[#262626] border border-white/[0.08] flex items-center overflow-visible">
                {/* Filled Gradient Bar */}
                <div
                  className="h-full bg-gradient-to-r from-[#800E13] via-[#9e1218] to-[#be123c] rounded-full transition-all duration-100"
                  style={{ width: `${visualPercentage}%` }}
                />

                {/* Visible Circle Handle */}
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
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                !annual ? "bg-[#800E13] text-white shadow-xs" : "text-zinc-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
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

        {/* 2 Plan Cards Grid (Solo vs Growth) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">

          {/* 1. Solo Plan */}
          <div className="flex flex-col justify-between rounded-2xl bg-[#262626] border border-white/[0.08] hover:border-white/[0.15] transition-all p-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-white">
                  {plans?.solo.name || "Solo Plan"}
                </h3>
                <span className="text-[11px] font-mono text-zinc-400 bg-[#1F1F1F] px-2.5 py-0.5 rounded-md border border-white/[0.06]">
                  Indie / Solo
                </span>
              </div>
              <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
                {plans?.solo.tagline || "For indie founders, solo developers, and growing products."}
              </p>

              {/* Animated Price */}
              <div className="mb-5 flex items-baseline gap-1 font-mono">
                <span className="text-4xl font-extrabold text-white tracking-tight">
                  $<AnimatedNumber value={soloPrice} />
                </span>
                <span className="text-xs text-zinc-400 font-sans">
                  / month {annual && <span className="text-[10px] text-zinc-500">(billed annually)</span>}
                </span>
              </div>

              {/* Features List */}
              <div className="pt-4 border-t border-white/[0.06] space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-zinc-200 font-medium">
                  <Check className="h-3.5 w-3.5 text-[#800E13] shrink-0" />
                  <span><strong><AnimatedNumber value={current.events} /></strong> monthly events</span>
                </div>
                {plans?.solo.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-zinc-300">
                    <Check className="h-3.5 w-3.5 text-[#800E13] shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 text-zinc-500">
                  <X className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                  <span>No X (Twitter) Social Radar</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Button
                className="w-full bg-[#1F1F1F] hover:bg-[#252525] text-white border border-white/[0.1] font-semibold h-10 rounded-xl text-xs cursor-pointer transition-all"
                asChild
              >
                <Link href="/auth/login">
                  Start 14-Day Free Trial
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>

          {/* 2. Growth Plan (Highlighted) */}
          <div className="relative flex flex-col justify-between rounded-2xl bg-[#262626] border-2 border-[#800E13] p-6 shadow-xl shadow-[#800E13]/10">

            {/* Highlight Pill */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-[#800E13] text-white font-semibold text-[11px] px-3 py-0.5 rounded-full border border-[#800E13]/60 shadow-md flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Most Popular
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-white">
                  {plans?.growth.name || "Growth Plan"}
                </h3>
                <span className="text-[11px] font-mono text-rose-300 bg-[#800E13]/20 px-2.5 py-0.5 rounded-md border border-[#800E13]/30">
                  Scale & Radar
                </span>
              </div>
              <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
                {plans?.growth.tagline || "For scaling startups, agencies, and high-volume platforms."}
              </p>

              {/* Animated Price */}
              <div className="mb-5 flex items-baseline gap-1 font-mono">
                <span className="text-4xl font-extrabold text-white tracking-tight">
                  $<AnimatedNumber value={growthPrice} />
                </span>
                <span className="text-xs text-zinc-400 font-sans">
                  / month {annual && <span className="text-[10px] text-zinc-500">(billed annually)</span>}
                </span>
              </div>

              {/* Features List */}
              <div className="pt-4 border-t border-white/[0.06] space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-zinc-200 font-medium">
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span><strong><AnimatedNumber value={current.events} /></strong> monthly events</span>
                </div>
                {plans?.growth.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-zinc-200 font-medium">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6">
              <Button
                className="w-full bg-[#800E13] hover:bg-[#9e1218] text-white border border-[#800E13] font-semibold h-10 rounded-xl text-xs shadow-md cursor-pointer transition-all"
                asChild
              >
                <Link href="/auth/login">
                  Get Started with Growth
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
