"use client";

import { 
  DollarSign, 
  Activity, 
  Code2, 
  ShieldCheck, 
  Filter, 
  Zap, 
  Check 
} from "lucide-react";

export function Features() {
  const features = [
    {
      icon: DollarSign,
      badge: "Revenue-First",
      title: "Direct Revenue Attribution",
      desc: "Stop looking at raw pageviews. See exactly which Twitter post, Google search, or newsletter issue generated paying customers.",
      highlights: [
        "Revenue per Visitor (RPV)",
        "Polar & Stripe Webhook sync",
        "Channel ROI calculation",
      ],
    },
    {
      icon: Activity,
      badge: "Sub-Second",
      title: "Real-Time Live Pulse",
      desc: "Watch visitors browse your site in real time. See what pages they land on and where they click the instant it happens.",
      highlights: [
        "Live online visitor counter",
        "Real-time event stream",
        "Instant conversion triggers",
      ],
    },
    {
      icon: Code2,
      badge: "Zero-Code",
      title: "Declarative HTML Data-Goals",
      desc: "Track custom actions without writing JavaScript. Just add data-goal=\"signup\" to any button, link, or form in your HTML.",
      highlights: [
        "HTML data-goal auto-capture",
        "SPA route transition tracking",
        "Type-safe @analytika/tracker",
      ],
    },
    {
      icon: ShieldCheck,
      badge: "100% Compliant",
      title: "Cookieless & Privacy-First",
      desc: "Zero tracking cookies, zero IP logging, and zero cross-site profiling. 100% compliant with GDPR, CCPA, and PECR by design.",
      highlights: [
        "No cookie consent banner needed",
        "Anonymized visitor hashing",
        "Full customer data ownership",
      ],
    },
    {
      icon: Filter,
      badge: "Funnels",
      title: "Conversion Funnel Visualizer",
      desc: "Analyze customer journey drop-offs in sub-seconds using Analytika's high-speed funnel aggregation engine.",
      highlights: [
        "Step-by-step drop-off analysis",
        "Custom multi-event funnels",
        "Timeline date filtering",
      ],
    },
    {
      icon: Zap,
      badge: "< 2.5 KB",
      title: "Ultra-Lightweight Footprint",
      desc: "Over 20x smaller than Google Analytics. Uses non-blocking asynchronous beacons so your Google Lighthouse score stays 100/100.",
      highlights: [
        "Zero external dependencies",
        "sendBeacon unload delivery",
        "Zero render blocking",
      ],
    },
  ];

  return (
    <section id="features" className="py-20 relative scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-300 mb-3">
            Built for Modern Founders
          </p>
          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight mb-4">
            Everything You Need to Understand & Grow Traffic
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg">
            High-signal analytics without the clutter. Designed for speed, clarity, and revenue growth.
          </p>
        </div>

        {/* Minimal Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, idx) => (
            <div 
              key={idx} 
              className="flex flex-col justify-between rounded-xl bg-[#262626] border border-white/[0.08] p-6 hover:border-white/20 transition-all duration-200"
            >
              <div>
                {/* Header with Consistent Icon and Category */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1F1F1F] border border-white/[0.08] text-[#800E13] shadow-xs">
                    <f.icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <span className="text-xs font-medium text-zinc-400 font-mono">
                    {f.badge}
                  </span>
                </div>

                {/* Title and Description */}
                <h3 className="text-lg font-semibold text-white mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                  {f.desc}
                </p>
              </div>

              {/* Highlights Checklist */}
              <div className="pt-4 border-t border-white/[0.06]">
                <ul className="space-y-2">
                  {f.highlights.map((h, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-zinc-300">
                      <Check className="h-3.5 w-3.5 text-[#800E13] shrink-0" strokeWidth={2.5} />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
