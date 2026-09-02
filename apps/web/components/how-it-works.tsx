"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Check, 
  Copy, 
  Terminal, 
  Code2, 
  Globe, 
  Key, 
  FileCode2,
  ArrowRight
} from "lucide-react";

export function HowItWorks() {
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedNpm, setCopiedNpm] = useState(false);

  // Domain input state for bottom CTA
  const [domain, setDomain] = useState("");
  const [cleanHost, setCleanHost] = useState("");
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [faviconLoaded, setFaviconLoaded] = useState(false);

  const extractHostname = (input: string): string => {
    let clean = input.trim().toLowerCase();
    clean = clean.replace(/^(https?:\/\/)?(www\.)?/, "");
    clean = clean.split("/")[0].split("?")[0].split("#")[0];
    return clean;
  };

  useEffect(() => {
    const host = extractHostname(domain);
    const isValidDomain = host.includes(".") && host.split(".").pop()!.length >= 2 && !host.endsWith(".");

    if (!isValidDomain) {
      setCleanHost("");
      setFaviconUrl(null);
      setFaviconLoaded(false);
      return;
    }

    const timer = setTimeout(() => {
      setCleanHost(host);
      setFaviconLoaded(false);
      setFaviconUrl(`https://www.google.com/s2/favicons?domain=${host}&sz=64`);
    }, 300);

    return () => clearTimeout(timer);
  }, [domain]);

  const rawScript = `<script 
  defer 
  src="https://analytika.me/a.js"
  data-website-id="YOUR-WEBSITE-ID">
</script>`;

  const rawNpm = `// 1. Install client package
npm install @analytika/tracker

// 2. Initialize in your App or Layout
import { initAnalytics, trackEvent } from "@analytika/tracker";

initAnalytics({ websiteId: "YOUR-WEBSITE-ID" });

// 3. Optional custom event tracking
trackEvent("plan_purchased", { event_value: 49.00 });`;

  const copyToClipboard = (text: string, type: "script" | "npm") => {
    navigator.clipboard.writeText(text);
    if (type === "script") {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    } else {
      setCopiedNpm(true);
      setTimeout(() => setCopiedNpm(false), 2000);
    }
  };

  return (
    <section id="how-it-works" className="py-20 relative scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-300 mb-2">
            2-Minute Installation
          </p>
          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-3">
            How It Works in 3 Simple Steps
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base">
            No complex tag managers, no data engineering, and no slowdown. Just paste and track.
          </p>
        </div>

        {/* 3 Step Visual Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          
          {/* Step 1 */}
          <div className="flex flex-col rounded-xl bg-[#262626] border border-white/[0.08] overflow-hidden hover:border-white/20 transition-all duration-200">
            <div className="h-36 bg-[#1c1c1c] border-b border-white/[0.06] p-4 flex flex-col justify-center items-center text-center relative overflow-hidden">
              <div className="w-full max-w-[220px] rounded-lg bg-[#262626] p-3 border border-white/[0.08] shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <Globe className="h-3.5 w-3.5 text-[#800E13]" />
                  <span className="font-mono text-[11px]">mywebsite.com</span>
                </div>
                <div className="flex items-center justify-between bg-[#1F1F1F] px-2 py-1 rounded border border-white/[0.04] text-[10px] font-mono text-zinc-400">
                  <span className="truncate">ana_live_9a8f2...</span>
                  <Key className="h-3 w-3 text-rose-400 shrink-0" />
                </div>
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#800E13] text-[11px] font-bold text-white">
                    1
                  </span>
                  <h3 className="text-base font-semibold text-white">Create Your Account</h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Sign up in seconds using passwordless email OTP. Add your domain to generate your live tracking key.
                </p>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col rounded-xl bg-[#262626] border border-white/[0.08] overflow-hidden hover:border-white/20 transition-all duration-200">
            <div className="h-36 bg-[#1c1c1c] border-b border-white/[0.06] p-4 flex flex-col justify-center items-center relative overflow-hidden">
              <div className="w-full max-w-[220px] rounded-lg bg-[#181818] p-2.5 border border-white/[0.08] font-mono text-[9px] text-zinc-300 leading-tight space-y-1">
                <div className="flex items-center gap-1 pb-1 border-b border-white/[0.06] text-zinc-500 text-[8px]">
                  <FileCode2 className="h-2.5 w-2.5 text-rose-400" />
                  <span>index.html</span>
                </div>
                <div className="text-zinc-500">&lt;<span className="text-rose-400">script</span> <span className="text-amber-300">defer</span></div>
                <div className="pl-1.5 text-zinc-400"><span className="text-amber-300">data-api-key</span>=<span className="text-emerald-400">&quot;ana_live_...&quot;</span></div>
                <div className="pl-1.5 text-zinc-400"><span className="text-amber-300">src</span>=<span className="text-emerald-400">&quot;.../a.js&quot;</span>&gt;</div>
                <div className="text-zinc-500">&lt;/<span className="text-rose-400">script</span>&gt;</div>
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#800E13] text-[11px] font-bold text-white">
                    2
                  </span>
                  <h3 className="text-base font-semibold text-white">Embed the Tracking Code</h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Drop the 1-line script into your HTML head or install our typed modern NPM package in your Next.js app.
                </p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col rounded-xl bg-[#262626] border border-white/[0.08] overflow-hidden hover:border-white/20 transition-all duration-200">
            <div className="h-36 bg-[#1c1c1c] border-b border-white/[0.06] p-4 flex flex-col justify-center items-center relative overflow-hidden">
              <div className="w-full max-w-[220px] rounded-lg bg-[#262626] p-3 border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 text-[10px]">Revenue Growth</span>
                  <span className="text-emerald-400 font-semibold text-[11px]">+38% ROI</span>
                </div>
                <div className="flex items-end gap-1.5 h-8 pt-1">
                  {[25, 45, 30, 65, 80, 55, 100].map((h, i) => (
                    <div key={i} style={{ height: `${h}%` }} className="flex-1 bg-[#800E13] rounded-t-xs" />
                  ))}
                </div>
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#800E13] text-[11px] font-bold text-white">
                    3
                  </span>
                  <h3 className="text-base font-semibold text-white">Gain Instant Insights</h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Watch live active visitors, referral channels, top pages, and attributed revenue stream straight in.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Fully Responsive Code Snippet Editor Box */}
        <div className="mx-auto max-w-3xl rounded-xl bg-[#181818] border border-white/[0.1] overflow-hidden shadow-2xl mb-14">
          <Tabs defaultValue="script" className="w-full">
            
            {/* Window Header Bar (Responsive) */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-b border-white/[0.06] bg-[#1f1f1f] gap-2">
              
              {/* Traffic Light Dots */}
              <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56] border border-[#e0443e]/50" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e] border border-[#dea123]/50" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f] border border-[#1aab29]/50" />
              </div>

              {/* Tab Selector (Full width on small mobile, auto on desktop) */}
              <TabsList className="bg-[#141414] p-0.5 border border-white/[0.06] rounded-lg h-7 sm:h-8 flex-1 sm:flex-initial grid grid-cols-2 sm:flex">
                <TabsTrigger 
                  value="script" 
                  className="text-[11px] sm:text-xs px-2.5 sm:px-3 font-medium data-[state=active]:bg-[#800E13] data-[state=active]:text-white transition-all truncate"
                >
                  <Code2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 shrink-0 inline" /> HTML Script
                </TabsTrigger>
                <TabsTrigger 
                  value="npm" 
                  className="text-[11px] sm:text-xs px-2.5 sm:px-3 font-medium data-[state=active]:bg-[#800E13] data-[state=active]:text-white transition-all truncate"
                >
                  <Terminal className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 shrink-0 inline" /> NPM SDK
                </TabsTrigger>
              </TabsList>

              {/* Lightweight Badge (Hidden on mobile, shown on tablet/desktop) */}
              <div className="hidden md:flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                &lt; 2.5 KB Gzipped
              </div>
            </div>

            {/* Script Tab Content */}
            <TabsContent value="script" className="p-0 m-0 relative">
              
              {/* File Sub-Bar */}
              <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 border-b border-white/[0.04] bg-[#161616] text-[11px] font-mono text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <FileCode2 className="h-3.5 w-3.5 text-rose-400" />
                  <span>index.html</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 sm:h-7 text-[11px] text-zinc-300 hover:text-white hover:bg-white/[0.08] px-2 gap-1"
                  onClick={() => copyToClipboard(rawScript, "script")}
                >
                  {copiedScript ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Code Body */}
              <div className="p-3 sm:p-5 font-mono text-[11px] sm:text-sm leading-relaxed overflow-x-auto flex items-start gap-3 sm:gap-4 bg-[#141414]">
                {/* Gutter Line Numbers */}
                <div className="flex flex-col text-right text-zinc-600 select-none text-[11px] sm:text-xs pt-0.5 shrink-0">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                </div>

                {/* Syntax Code */}
                <div className="flex-1 text-zinc-200 min-w-0 whitespace-pre">
                  <div>
                    <span className="text-zinc-500">&lt;</span>
                    <span className="text-rose-400 font-semibold">script</span>
                  </div>
                  <div className="pl-3 sm:pl-4">
                    <span className="text-amber-300">defer</span>
                  </div>
                  <div className="pl-3 sm:pl-4">
                    <span className="text-amber-300">src</span>
                    <span className="text-zinc-500">=</span>
                    <span className="text-emerald-400">&quot;https://analytika.me/a.js&quot;</span>
                  </div>
                  <div className="pl-3 sm:pl-4">
                    <span className="text-amber-300">data-website-id</span>
                    <span className="text-zinc-500">=</span>
                    <span className="text-emerald-400">&quot;YOUR-WEBSITE-ID&quot;</span>
                    <span className="text-zinc-500">&gt;</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">&lt;/</span>
                    <span className="text-rose-400 font-semibold">script</span>
                    <span className="text-zinc-500">&gt;</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* NPM Tab Content */}
            <TabsContent value="npm" className="p-0 m-0 relative">
              
              {/* File Sub-Bar */}
              <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 border-b border-white/[0.04] bg-[#161616] text-[11px] font-mono text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-rose-400" />
                  <span>app/layout.tsx</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 sm:h-7 text-[11px] text-zinc-300 hover:text-white hover:bg-white/[0.08] px-2 gap-1"
                  onClick={() => copyToClipboard(rawNpm, "npm")}
                >
                  {copiedNpm ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Code Body */}
              <div className="p-3 sm:p-5 font-mono text-[11px] sm:text-sm leading-relaxed overflow-x-auto flex items-start gap-3 sm:gap-4 bg-[#141414]">
                {/* Gutter Line Numbers */}
                <div className="flex flex-col text-right text-zinc-600 select-none text-[11px] sm:text-xs pt-0.5 shrink-0">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                  <span>6</span>
                  <span>7</span>
                  <span>8</span>
                  <span>9</span>
                  <span>10</span>
                </div>

                {/* Syntax Code */}
                <div className="flex-1 text-zinc-200 min-w-0 whitespace-pre">
                  <div className="text-zinc-500 italic">// 1. Install client package</div>
                  <div className="text-zinc-300">
                    <span className="text-rose-400">npm</span> install @analytika/tracker
                  </div>
                  <div className="h-2 sm:h-3"></div>
                  <div className="text-zinc-500 italic">// 2. Initialize in your App or Layout</div>
                  <div>
                    <span className="text-purple-400">import</span> &#123; <span className="text-rose-300">initAnalytics</span>, <span className="text-rose-300">trackEvent</span> &#125; <span className="text-purple-400">from</span> <span className="text-emerald-400">&quot;@analytika/tracker&quot;</span>;
                  </div>
                  <div className="h-2 sm:h-3"></div>
                  <div>
                    <span className="text-rose-400 font-semibold">initAnalytics</span>(&#123; <span className="text-amber-300">websiteId</span>: <span className="text-emerald-400">&quot;YOUR-WEBSITE-ID&quot;</span> &#125;);
                  </div>
                  <div className="h-2 sm:h-3"></div>
                  <div className="text-zinc-500 italic">// 3. Optional custom event tracking</div>
                  <div>
                    <span className="text-rose-400 font-semibold">trackEvent</span>(<span className="text-emerald-400">&quot;plan_purchased&quot;</span>, &#123; <span className="text-amber-300">event_value</span>: <span className="text-rose-300 font-semibold">49.00</span> &#125;);
                  </div>
                </div>
              </div>
            </TabsContent>

          </Tabs>
        </div>

        {/* Bottom Domain Input CTA (Matching Hero with Dynamic Favicon Discovery) */}
        <div className="text-center max-w-md mx-auto">
          <div className="mb-3">
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
                {faviconUrl && (
                  <img
                    src={faviconUrl}
                    alt={`${cleanHost} icon`}
                    onLoad={() => setFaviconLoaded(true)}
                    onError={() => setFaviconLoaded(false)}
                    className="h-5 w-5 rounded object-contain shadow-xs"
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
                className="bg-[#800E13] hover:bg-[#9e1218] text-white font-medium text-sm px-5 h-10 shrink-0 border border-[#800E13] transition-all"
              >
                Start Free
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </form>
          </div>
          <p className="text-xs text-zinc-400">
            14-day free trial. No card required.
          </p>
        </div>

      </div>
    </section>
  );
}
