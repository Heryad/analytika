"use client";

import { useState, useEffect } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

export function Testimonials() {
  const [currentPage, setCurrentPage] = useState(0);

  const testimonials = [
    // Set 1
    [
      {
        name: "Liam Thorne",
        saas: "supadeploy.com",
        domain: "supadeploy.com",
        quote: "We replaced our legacy analytics setup with Analytika across 4 production apps. Tying revenue directly to our launch channels gave us complete clarity on where paying users came from.",
      },
      {
        name: "Elena Rostova",
        saas: "promptlayer.dev",
        domain: "promptlayer.dev",
        quote: "The ClickHouse engine makes analytics lightning fast. Zero tracking cookies means zero consent banners—our EU signups increased by 18% immediately.",
      },
      {
        name: "Marcus Vance",
        saas: "vectorflow.io",
        domain: "vectorflow.io",
        quote: "The MCP server integration is unbelievable. I can query our top conversion funnels directly inside Claude and Cursor without opening another dashboard.",
      },
    ],
    // Set 2
    [
      {
        name: "David Chen",
        saas: "shiplog.co",
        domain: "shiplog.co",
        quote: "Adding data-goal='upgrade' to our pricing buttons took 10 seconds. No event listener spaghetti, just clean declarative tracking that works out of the box.",
      },
      {
        name: "Sarah Lindqvist",
        saas: "typedflow.app",
        domain: "typedflow.app",
        quote: "The < 2.5 KB footprint kept our site's Google Core Web Vitals at a perfect 100 score. Plus, real-time live visitors stream in with sub-second latency.",
      },
      {
        name: "Alex Rivera",
        saas: "devpulse.tools",
        domain: "devpulse.tools",
        quote: "Being able to see Revenue per Visitor across our newsletter and community campaigns transformed how we allocate our product marketing time.",
      },
    ],
  ];

  // Auto-rotate every 8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % testimonials.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const currentSet = testimonials[currentPage];

  return (
    <section id="reviews" className="py-20 relative scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-300 mb-2">
            Founder Love
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
            Trusted by 23,700+ Founders & Fast Teams
          </h2>
          <p className="text-zinc-400 text-sm">
            High-signal feedback from teams tracking revenue, speed, and privacy.
          </p>
        </div>

        {/* 3 Clean Quotes in Curved Wave/Arc Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 items-start mb-12 transition-all duration-300">
          {currentSet.map((t, idx) => (
            <div
              key={`${currentPage}-${idx}`}
              className={`flex flex-col justify-between space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                idx === 1 
                  ? "md:-translate-y-4" 
                  : "md:translate-y-4"
              }`}
            >
              {/* 5 Amber Stars */}
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>

              {/* Clean Highlighted Quote (15% Larger) */}
              <p className="text-[15px] sm:text-[16px] text-zinc-200 leading-relaxed min-h-[80px]">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Founder Details with Direct SaaS Favicon */}
              <div className="flex items-center gap-3 pt-2">
                {/* Direct Favicon */}
                <img
                  src={`https://www.google.com/s2/favicons?domain=${t.domain}&sz=64`}
                  alt={`${t.saas} icon`}
                  className="h-6 w-6 object-contain rounded shrink-0"
                />

                <div className="leading-tight">
                  <p className="text-sm font-semibold text-white">
                    {t.name}
                  </p>
                  <a
                    href={`https://${t.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-rose-400 hover:text-rose-300 transition-colors font-mono"
                  >
                    {t.saas}
                  </a>
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* Smooth Pagination Dots & Arrow Controls */}
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={() => setCurrentPage((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))}
            className="p-1 text-zinc-500 hover:text-white transition-colors"
            aria-label="Previous reviews"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1.5">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentPage === i ? "w-6 bg-[#800E13]" : "w-1.5 bg-zinc-700 hover:bg-zinc-500"
                }`}
                aria-label={`Go to review page ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrentPage((prev) => (prev + 1) % testimonials.length)}
            className="p-1 text-zinc-500 hover:text-white transition-colors"
            aria-label="Next reviews"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

      </div>
    </section>
  );
}
