"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Globe } from "lucide-react";
import { WebsiteFavicon } from "@/components/website-favicon";

export function Hero() {
  const [domain, setDomain] = useState("");
  const [cleanHost, setCleanHost] = useState("");
  const [faviconLoaded, setFaviconLoaded] = useState(false);

  // Helper to extract clean hostname (e.g. "github.com" from "https://www.github.com/feed")
  const extractHostname = (input: string): string => {
    let clean = input.trim().toLowerCase();
    clean = clean.replace(/^(https?:\/\/)?(www\.)?/, "");
    clean = clean.split("/")[0].split("?")[0].split("#")[0];
    return clean;
  };

  // Debounced domain validation
  useEffect(() => {
    const host = extractHostname(domain);
    
    // Check if valid domain format (has a dot and valid TLD length)
    const isValidDomain = host.includes(".") && host.split(".").pop()!.length >= 2 && !host.endsWith(".");

    if (!isValidDomain) {
      setCleanHost("");
      setFaviconLoaded(false);
      return;
    }

    const timer = setTimeout(() => {
      setCleanHost(host);
    }, 250);

    return () => clearTimeout(timer);
  }, [domain]);

  const users = [
    { name: "Jack", bg: "bg-zinc-700" },
    { name: "Edwin", bg: "bg-zinc-600" },
    { name: "Adam", bg: "bg-zinc-700" },
    { name: "RJ", bg: "bg-zinc-600" },
    { name: "Serg", bg: "bg-zinc-700" },
    { name: "Stephon", bg: "bg-zinc-600" },
    { name: "Katt", bg: "bg-zinc-700" },
  ];

  return (
    <section className="pt-20 pb-16 text-center">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        
        {/* Clean, Bold Headline */}
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.15] mb-5">
          Analytics that track revenue, not just pageviews.
        </h1>

        {/* Crisp, Direct Subtitle */}
        <p className="mx-auto max-w-2xl text-base sm:text-lg text-zinc-400 leading-relaxed mb-8">
          Discover which marketing channels, posts, and campaigns actually bring paying customers so you can scale what works.
        </p>

        {/* Website Input CTA Box with Dynamic Favicon Slide-in */}
        <div className="mx-auto max-w-md mb-3">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const targetDomain = cleanHost || extractHostname(domain) || domain;
              window.location.href = `/auth/login?domain=${encodeURIComponent(targetDomain)}`;
            }}
            className="relative flex items-center rounded-lg bg-[#262626] p-1.5 border border-white/[0.1] shadow-sm focus-within:border-[#800E13] transition-colors"
          >
            {/* Sliding Favicon Container */}
            <div 
              className={`flex items-center justify-center transition-all duration-300 ease-out overflow-hidden ${
                faviconLoaded 
                  ? "w-7 h-7 opacity-100 translate-x-0 ml-1.5 mr-0" 
                  : "w-0 h-7 opacity-0 -translate-x-3 ml-0 mr-0"
              }`}
            >
              {cleanHost && (
                <WebsiteFavicon
                  domain={cleanHost}
                  className="h-5 w-5 rounded object-contain shadow-xs shrink-0"
                  onLoadedChange={setFaviconLoaded}
                  hideOnFail
                />
              )}
            </div>

            <input
              type="text"
              placeholder="website.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full bg-transparent px-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
            />

            <Button
              type="submit"
              data-ana-event="signup_clicked"
              className="bg-[#800E13] hover:bg-[#9e1218] text-white font-medium text-sm px-5 h-10 shrink-0 border border-[#800E13] transition-all"
            >
              Start Free
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </form>
        </div>

        {/* Micro-copy Note */}
        <p className="text-xs text-zinc-500 mb-8">
          14-day free trial. No card required.
        </p>

        {/* Clean Social Proof Row */}
        <div className="flex items-center justify-center gap-3 text-xs text-zinc-400">
          <div className="flex -space-x-1.5 overflow-hidden">
            {users.map((u, i) => (
              <div
                key={i}
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${u.bg} ring-2 ring-[#1F1F1F] font-medium text-[10px] text-zinc-200 uppercase`}
                title={u.name}
              >
                {u.name.slice(0, 1)}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-amber-400" />
              ))}
            </div>
            <span className="font-medium text-zinc-300">Loved by 23,745 users</span>
          </div>
        </div>

      </div>
    </section>
  );
}
