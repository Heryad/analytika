"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function McpDemo() {
  const logos = [
    { name: "Claude", src: "/claude.svg", delay: "0s" },
    { name: "OpenAI", src: "/openai.svg", delay: "0.5s" },
    { name: "Codex", src: "/codex.svg", delay: "1.0s" },
    { name: "Gemini", src: "/gemini.svg", delay: "1.5s" },
    { name: "Grok", src: "/grok.svg", delay: "2.0s" },
  ];

  const useCases = [
    {
      id: "attribution",
      modelName: "Claude Desktop",
      modelIcon: "/claude.svg",
      query: "Which marketing channel brought us the most paying customers this week?",
      reasoning: "Evaluating ...",
      stats: [
        { label: "Top Revenue Channel", value: "Twitter / X (@founder)", sub: "68% of total volume" },
        { label: "Attributed Sales", value: "$4,890.00", sub: "38 Pro Subscriptions" },
        { label: "Revenue / Visitor", value: "$3.42 RPV", sub: "+24% vs baseline" },
      ],
      insight: "European traffic converted 2.1x higher after cookieless privacy was enabled.",
    },
    {
      id: "funnel",
      modelName: "ChatGPT (OpenAI)",
      modelIcon: "/openai.svg",
      query: "Where are visitors dropping off in our signup onboarding funnel?",
      reasoning: "Evaluating ...",
      stats: [
        { label: "Step 1: Domain Setup", value: "84.2%", sub: "10,480 completed" },
        { label: "Step 2: OTP Verify", value: "41.6% Drop", sub: "Primary friction point" },
        { label: "Recoverable Signups", value: "~640 / wk", sub: "Via Google OAuth" },
      ],
      insight: "Adding social login on Step 2 would lift total onboarding completion from 42% to 68%.",
    },
    {
      id: "spike",
      modelName: "Google Gemini",
      modelIcon: "/gemini.svg",
      query: "Why is live traffic spiking right now, and what page are they viewing?",
      reasoning: "Evaluating ...",
      stats: [
        { label: "Active Live Visitors", value: "412 Online", sub: "Spike factor: +580%" },
        { label: "Top Referring Source", value: "Hacker News (#2)", sub: "89% of current traffic" },
        { label: "Query Response Time", value: "4ms Latency", sub: "0 dropped events" },
      ],
      insight: "Traffic is heavily concentrated on /blog/clickhouse-architecture with 14 new signups in 30 mins.",
    },
    {
      id: "devices",
      modelName: "xAI Grok",
      modelIcon: "/grok.svg",
      query: "Compare our conversion rates between mobile and desktop visitors this month.",
      reasoning: "Evaluating ...",
      stats: [
        { label: "Desktop Conversion", value: "18.4%", sub: "$5.80 RPV average" },
        { label: "Mobile Conversion", value: "7.2%", sub: "$1.95 RPV average" },
        { label: "Mobile Checkout Lift", value: "+22% WoW", sub: "After 1-column form" },
      ],
      insight: "Desktop users generate 76% of total revenue. Mobile conversion increased by 22% after simplification.",
    },
    {
      id: "pages",
      modelName: "Codex AI",
      modelIcon: "/codex.svg",
      query: "What are our top 3 revenue-generating landing pages over the last 30 days?",
      reasoning: "Evaluating ...",
      stats: [
        { label: "1. /pricing", value: "$14,200", sub: "48% of total MRR" },
        { label: "2. /blog/sdk-guide", value: "$6,400", sub: "Highest developer velocity" },
        { label: "3. /features", value: "$4,100", sub: "16.2% conversion rate" },
      ],
      insight: "The SDK guide article converts free trial users into annual Pro subscribers at 2.4x average velocity.",
    },
  ];

  const [caseIndex, setCaseIndex] = useState(0);
  const [stage, setStage] = useState<"typing" | "thinking" | "answered">("typing");
  const [typedChars, setTypedChars] = useState(0);

  const currentCase = useCases[caseIndex];

  // Animated Loop Controller
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (stage === "typing") {
      if (typedChars < currentCase.query.length) {
        timer = setTimeout(() => {
          setTypedChars((prev) => prev + 1);
        }, 28);
      } else {
        timer = setTimeout(() => {
          setStage("thinking");
        }, 350);
      }
    } else if (stage === "thinking") {
      timer = setTimeout(() => {
        setStage("answered");
      }, 1100);
    } else if (stage === "answered") {
      timer = setTimeout(() => {
        setStage("typing");
        setTypedChars(0);
        setCaseIndex((prev) => (prev + 1) % useCases.length);
      }, 5500);
    }

    return () => clearTimeout(timer);
  }, [stage, typedChars, currentCase.query.length, useCases.length]);

  return (
    <section id="mcp" className="py-24 relative scroll-mt-20 overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">

        {/* Section Overline */}
        <p className="text-xs font-semibold uppercase tracking-wider text-rose-300 mb-6">
          Model Context Protocol (MCP)
        </p>

        {/* Single Row of Floating AI Badges with Staggered Wave Animation */}
        <div className="flex items-center justify-center gap-3.5 sm:gap-5 mb-8">
          {logos.map((logo, idx) => (
            <div
              key={idx}
              className="animate-wave flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-[#262626] border border-white/[0.08] shadow-lg hover:border-white/20 hover:scale-110 transition-transform p-3"
              style={{ animationDelay: logo.delay }}
              title={logo.name}
            >
              <Image
                src={logo.src}
                alt={`${logo.name} logo`}
                width={28}
                height={28}
                className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
              />
            </div>
          ))}
        </div>

        {/* Headline & Subtitle */}
        <div className="max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-3">
            Turn Your AI IDE into an Analytics Copilot
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Bridge ClickHouse telemetry straight into your coding environment. Inspect traffic surges, uncover profitable referral loops, and diagnose conversion funnels directly from your AI prompt.
          </p>
        </div>

        {/* Spacious, Elegant macOS Chat Window */}
        <div className="max-w-3xl sm:max-w-4xl mx-auto rounded-2xl bg-[#181818] border border-white/[0.1] shadow-2xl overflow-hidden text-left mb-10">

          {/* macOS Title Bar with Dynamic Model Name */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-[#202020]">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/40" />
              <span className="h-3 w-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/40" />
              <span className="h-3 w-3 rounded-full bg-[#27c93f] border border-[#1aab29]/40" />
            </div>

            <div className="flex items-center gap-2 font-mono text-xs text-zinc-300 transition-all duration-300">
              <span className="font-semibold text-white">{currentCase.modelName}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400">Analytika MCP</span>
            </div>

            <div className="w-10" />
          </div>

          {/* Conversation Body (15% Taller with Generous Breathing Room) */}
          <div className="p-7 sm:p-9 space-y-6 bg-[#141414] min-h-[445px] sm:min-h-[460px] flex flex-col justify-start">

            {/* 1. User Message with Animated Typing + Slender Crimson Cursor (Centered with Avatar) */}
            <div className="flex items-center justify-end gap-3 max-w-xl ml-auto">
              <div className="rounded-2xl rounded-tr-xs bg-[#242424] border border-white/[0.08] px-4 py-3 text-sm text-zinc-100 shadow-md leading-relaxed">
                <span>{currentCase.query.slice(0, typedChars)}</span>
                {stage === "typing" && (
                  <span className="inline-block w-[2px] h-4 bg-[#e11d48] shadow-[0_0_6px_rgba(225,29,72,0.9)] ml-1 relative -top-[1.5px] align-middle animate-cursor-blink" />
                )}
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#333333] border border-white/[0.1] text-zinc-300 shrink-0 text-xs font-bold shadow-xs">
                U
              </div>
            </div>

            {/* 2. AI Model Thinking State (Reasoning Bubble with Dynamic Model Icon) */}
            {stage === "thinking" && (
              <div className="flex items-start gap-3 animate-in fade-in duration-300">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#262626] border border-white/[0.1] shrink-0 p-1.5 animate-pulse">
                  <Image
                    src={currentCase.modelIcon}
                    alt={`${currentCase.modelName} icon`}
                    width={20}
                    height={20}
                    className="w-5 h-5 object-contain opacity-80"
                  />
                </div>

                <div className="inline-flex items-center gap-2 rounded-full bg-[#1c1c1c] border border-white/[0.08] px-3.5 py-1.5 text-xs text-zinc-400 shadow-xs">
                  <span className="italic">{currentCase.reasoning}</span>
                </div>
              </div>
            )}

            {/* 3. AI Model Answered State with Dynamic Model Icon */}
            {stage === "answered" && (
              <div className="flex items-start gap-3.5 max-w-3xl animate-in fade-in duration-300">

                {/* Model Logo Avatar with Smooth Fade Animation */}
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#262626] border border-white/[0.1] shrink-0 shadow-sm p-1.5 mt-1 transition-opacity duration-300">
                  <Image
                    src={currentCase.modelIcon}
                    alt={`${currentCase.modelName} icon`}
                    width={20}
                    height={20}
                    className="w-5 h-5 object-contain"
                  />
                </div>

                {/* Answer Container */}
                <div className="space-y-4 flex-1">

                  {/* High-Impact 3-Metric Showcase Card */}
                  <div className="rounded-2xl rounded-tl-xs bg-[#1a1a1a] border border-white/[0.08] p-5 sm:p-6 shadow-xl space-y-4">

                    {/* 3 Prominent Stat Columns */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {currentCase.stats.map((stat, i) => (
                        <div
                          key={i}
                          className="rounded-xl bg-[#222222] p-3.5 border border-white/[0.04] flex flex-col justify-between"
                        >
                          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                            {stat.label}
                          </span>
                          <span className="text-base sm:text-lg font-bold font-mono text-white block">
                            {stat.value}
                          </span>
                          <span className="text-[11px] text-zinc-500 font-mono mt-1 block">
                            {stat.sub}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Actionable Strategy Takeaway */}
                    <div className="rounded-xl bg-[#141414] p-3.5 border border-white/[0.06] flex items-start gap-2.5 text-xs sm:text-sm text-zinc-300 leading-relaxed">
                      <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{currentCase.insight}</span>
                    </div>

                  </div>

                </div>
              </div>
            )}

          </div>

        </div>

        {/* Connect Action Button */}
        <div className="flex flex-col items-center gap-2">
          <Button
            size="lg"
            className="bg-[#800E13] hover:bg-[#9e1218] text-white font-semibold px-8 h-12 rounded-xl shadow-lg border border-[#800E13] transition-all text-sm"
            asChild
          >
            <Link href="/auth/login">
              Connect with MCP
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <span className="text-xs text-zinc-500 font-mono">
            mcp://api.analytika.dev
          </span>
        </div>

      </div>
    </section>
  );
}
