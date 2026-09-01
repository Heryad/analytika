"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Copy,
  Code2,
  FileCode2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { WorldMapBackground } from "@/components/world-map-bg";

// NPM Brand Icon
function NpmIcon({ className = "h-3.5 w-3.5 shrink-0" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      fillRule="evenodd"
      clipRule="evenodd"
      strokeLinejoin="round"
      strokeMiterlimit="2"
      className={className}
    >
      <g fillRule="nonzero">
        <path d="M10.999 500.999v-490h490v490h-490z" fill="#c12127" />
        <path d="M102.874 102.874h306.25v306.25h-61.25v-245h-91.875v245H102.874v-306.25z" fill="#fff" />
      </g>
    </svg>
  );
}

// Extract clean hostname for live favicon lookup
function extractHostname(url: string): string {
  try {
    let clean = url.trim().toLowerCase();
    if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
      clean = "https://" + clean;
    }
    const parsed = new URL(clean);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    const raw = url.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");
    return raw.split("/")[0].split("?")[0].split(":")[0];
  }
}

const COMMON_TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "America/New_York (EST / EDT)" },
  { value: "America/Chicago", label: "America/Chicago (CST / CDT)" },
  { value: "America/Denver", label: "America/Denver (MST / MDT)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST / PDT)" },
  { value: "America/Sao_Paulo", label: "America/Sao_Paulo (BRT)" },
  { value: "Europe/London", label: "Europe/London (GMT / BST)" },
  { value: "Europe/Paris", label: "Europe/Paris (CET / CEST)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (CET / CEST)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST +04:00)" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST +05:30)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT +08:00)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (JST +09:00)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AEST / AEDT)" },
];

function NewWebsiteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const incomingDomain = searchParams.get("domain") || "";

  // Steps: 1 -> 2
  const [step, setStep] = useState<1 | 2>(1);

  // Form State
  const [domain, setDomain] = useState(incomingDomain);
  const [cleanHost, setCleanHost] = useState("");
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [faviconLoaded, setFaviconLoaded] = useState(false);
  const [timezone, setTimezone] = useState("UTC");
  const [siteId, setSiteId] = useState("");

  // Step 2 State
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedNpm, setCopiedNpm] = useState(false);
  const [activeSnippetTab, setActiveSnippetTab] = useState<"script" | "npm">("script");

  // Auto detect user timezone on mount
  useEffect(() => {
    try {
      const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (userTz) setTimezone(userTz);
    } catch { }
  }, []);

  // Handle Domain Change and Live Favicon Loading
  useEffect(() => {
    const raw = domain.trim();
    if (!raw) {
      setCleanHost("");
      setFaviconUrl(null);
      setFaviconLoaded(false);
      return;
    }

    const host = extractHostname(raw);
    setCleanHost(host);

    if (host && host.includes(".") && host.length >= 4) {
      setFaviconUrl(`https://www.google.com/s2/favicons?domain=${host}&sz=64`);
      setSiteId(`ana_live_${host.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 12)}_${Math.random().toString(36).substring(2, 6)}`);
    } else {
      setFaviconUrl(null);
      setFaviconLoaded(false);
    }
  }, [domain]);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanHost) return;
    setStep(2);
  };

  const rawScript = `<script
  defer
  data-site-id="${siteId || "ana_live_9a8f2c3d4e5f"}"
  src="https://cdn.analytika.dev/script.js">
</script>`;

  const rawNpm = `// 1. Install client package
npm install @analytika/sdk

// 2. Initialize in your App or Layout
import { init, track } from "@analytika/sdk";

init("${siteId || "ana_live_9a8f2c3d4e5f"}");

// 3. Optional custom revenue goal tracking
track("purchase", { value: 49, currency: "USD" });`;

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
    <div className="relative min-h-[calc(100vh-140px)] flex flex-col justify-center items-center py-6 px-4">

      {/* Background Animated Real 2D World Map from public/world.svg */}
      <WorldMapBackground />

      {/* Main Flow Container */}
      <div className="relative z-10 w-full max-w-xl space-y-6">

        {/* Step Indicator Header directly on top of card */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 bg-[#1F1F1F] border-white/[0.08] hover:bg-[#262626] hover:border-white/[0.15] text-zinc-400 hover:text-white rounded-xl cursor-pointer shrink-0"
              title="Back to websites"
            >
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-lg font-bold text-white tracking-tight">
              Add Website
            </h1>
          </div>

          {/* Stepper (2 Steps) */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className={`px-2.5 py-0.5 rounded-full ${step === 1 ? "bg-[#800E13] text-white font-bold" : "bg-[#262626] text-zinc-400"}`}>
              1. Website
            </span>
            <span className="text-zinc-600">→</span>
            <span className={`px-2.5 py-0.5 rounded-full ${step === 2 ? "bg-[#800E13] text-white font-bold" : "bg-[#262626] text-zinc-400"}`}>
              2. Script
            </span>
          </div>
        </div>

        {/* STEP 1: WEBSITE DOMAIN & TIMEZONE */}
        {step === 1 && (
          <div className="rounded-2xl bg-[#262626] border border-white/[0.08] p-6 shadow-2xl space-y-5">
            <div>
              <h2 className="text-base font-bold text-white">
                Enter your website URL
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                We'll configure real-time cookieless analytics for your domain.
              </p>
            </div>

            <form onSubmit={handleStep1Submit} className="space-y-4">

              {/* Domain Input: Height locked to h-11 */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-medium text-zinc-300 block">
                  Domain
                </label>

                <div className="h-11 relative flex items-center rounded-xl bg-[#1F1F1F] p-1.5 border border-white/[0.08] focus-within:border-[#800E13] transition-colors">

                  {/* Sliding Favicon Preview */}
                  <div
                    className={`flex items-center justify-center transition-all duration-300 ease-out overflow-hidden ${faviconLoaded
                        ? "w-7 h-7 opacity-100 translate-x-0 ml-1.5 mr-1"
                        : "w-0 h-7 opacity-0 -translate-x-3 ml-0 mr-0"
                      }`}
                  >
                    {faviconUrl && (
                      <img
                        src={faviconUrl}
                        alt={`${cleanHost} icon`}
                        onLoad={() => setFaviconLoaded(true)}
                        onError={() => setFaviconLoaded(false)}
                        className="h-5 w-5 object-contain shrink-0"
                      />
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="website.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    required
                    autoFocus
                    className="w-full bg-transparent px-3 h-full text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Timezone Selector: Height locked to h-11 */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-medium text-zinc-300 block">
                  Reporting Timezone
                </label>

                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="h-11 bg-[#1F1F1F] border-white/[0.08] text-white rounded-xl text-xs px-3.5">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#262626] border-white/[0.1] text-zinc-200">
                    {COMMON_TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                    {!COMMON_TIMEZONES.some((tz) => tz.value === timezone) && (
                      <SelectItem value={timezone}>
                        {timezone}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Action */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={!cleanHost}
                  className="w-full h-11 bg-[#800E13] hover:bg-[#9e1218] text-white font-medium text-sm rounded-xl transition-all border border-[#800E13] flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

            </form>
          </div>
        )}

        {/* STEP 2: INSTALL SCRIPT */}
        {step === 2 && (
          <div className="rounded-2xl bg-[#262626] border border-white/[0.08] p-6 shadow-2xl space-y-5">
            <div>
              <h2 className="text-base font-bold text-white">
                Install Tracking Script
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Drop the 1-line script into your HTML head or install our typed NPM package.
              </p>
            </div>

            {/* Code Snippet Editor Box Matching Landing Page */}
            <div className="w-full rounded-xl bg-[#141414] border border-white/[0.1] overflow-hidden shadow-2xl">

              {/* Window Header Bar */}
              <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-white/[0.06] bg-[#1f1f1f] gap-2">

                {/* Traffic Light Dots */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56] border border-[#e0443e]/50" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e] border border-[#dea123]/50" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f] border border-[#1aab29]/50" />
                </div>

                {/* Tab Selector: HTML Script & NPM SDK with SVG */}
                <div className="bg-[#141414] p-0.5 border border-white/[0.06] rounded-lg h-7.5 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveSnippetTab("script")}
                    className={`text-xs px-3 py-1 font-medium rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${activeSnippetTab === "script"
                        ? "bg-[#800E13] text-white shadow-xs"
                        : "text-zinc-400 hover:text-white"
                      }`}
                  >
                    <Code2 className="h-3.5 w-3.5" />
                    <span>HTML Script</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSnippetTab("npm")}
                    className={`text-xs px-3 py-1 font-medium rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${activeSnippetTab === "npm"
                        ? "bg-[#800E13] text-white shadow-xs"
                        : "text-zinc-400 hover:text-white"
                      }`}
                  >
                    <NpmIcon className="h-3.5 w-3.5" />
                    <span>NPM Package</span>
                  </button>
                </div>
              </div>

              {/* HTML Script Tab Content */}
              {activeSnippetTab === "script" && (
                <div>
                  {/* File Sub-Bar */}
                  <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 border-b border-white/[0.04] bg-[#161616] text-[11px] font-mono text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <FileCode2 className="h-3.5 w-3.5 text-rose-400" />
                      <span>index.html</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[11px] text-zinc-300 hover:text-white hover:bg-white/[0.08] px-2 gap-1 cursor-pointer"
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

                  {/* Code Body with Line Numbers */}
                  <div className="p-4 font-mono text-xs leading-relaxed overflow-x-auto flex items-start gap-4 bg-[#141414]">
                    <div className="flex flex-col text-right text-zinc-600 select-none text-xs pt-0.5 shrink-0">
                      <span>1</span>
                      <span>2</span>
                      <span>3</span>
                      <span>4</span>
                      <span>5</span>
                    </div>

                    <div className="flex-1 text-zinc-200 min-w-0 whitespace-pre">
                      <div>
                        <span className="text-zinc-500">&lt;</span>
                        <span className="text-rose-400 font-semibold">script</span>
                      </div>
                      <div className="pl-4">
                        <span className="text-amber-300">defer</span>
                      </div>
                      <div className="pl-4">
                        <span className="text-amber-300">data-site-id</span>
                        <span className="text-zinc-500">=</span>
                        <span className="text-emerald-400">&quot;{siteId || "ana_live_9a8f2c3d4e5f"}&quot;</span>
                      </div>
                      <div className="pl-4">
                        <span className="text-amber-300">src</span>
                        <span className="text-zinc-500">=</span>
                        <span className="text-emerald-400">&quot;https://cdn.analytika.dev/script.js&quot;</span>
                        <span className="text-zinc-500">&gt;</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">&lt;/</span>
                        <span className="text-rose-400 font-semibold">script</span>
                        <span className="text-zinc-500">&gt;</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* NPM Tab Content */}
              {activeSnippetTab === "npm" && (
                <div>
                  {/* File Sub-Bar */}
                  <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 border-b border-white/[0.04] bg-[#161616] text-[11px] font-mono text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <NpmIcon className="h-3.5 w-3.5" />
                      <span>app/layout.tsx</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[11px] text-zinc-300 hover:text-white hover:bg-white/[0.08] px-2 gap-1 cursor-pointer"
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

                  {/* Code Body with Line Numbers */}
                  <div className="p-4 font-mono text-xs leading-relaxed overflow-x-auto flex items-start gap-4 bg-[#141414]">
                    <div className="flex flex-col text-right text-zinc-600 select-none text-xs pt-0.5 shrink-0">
                      <span>1</span>
                      <span>2</span>
                      <span>3</span>
                      <span>4</span>
                      <span>5</span>
                      <span>6</span>
                      <span>7</span>
                      <span>8</span>
                    </div>

                    <div className="flex-1 text-zinc-200 min-w-0 whitespace-pre">
                      <div className="text-zinc-500 italic">// 1. Install client package</div>
                      <div className="text-zinc-300">
                        <span className="text-rose-400">npm</span> install @analytika/sdk
                      </div>
                      <div className="h-2"></div>
                      <div className="text-zinc-500 italic">// 2. Initialize in your App or Layout</div>
                      <div>
                        <span className="text-purple-400">import</span> &#123; <span className="text-rose-300">init</span>, <span className="text-rose-300">track</span> &#125; <span className="text-purple-400">from</span> <span className="text-emerald-400">&quot;@analytika/sdk&quot;</span>;
                      </div>
                      <div className="h-1"></div>
                      <div>
                        <span className="text-rose-400 font-semibold">init</span>(<span className="text-emerald-400">&quot;{siteId || "ana_live_9a8f2c3d4e5f"}&quot;</span>);
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Navigation Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="border-white/[0.08] hover:bg-[#2d2d2d] text-zinc-400 hover:text-white h-10 px-4 rounded-xl text-xs cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Back
              </Button>

              <Button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="bg-[#800E13] hover:bg-[#9e1218] text-white font-medium text-xs sm:text-sm h-10 px-6 rounded-xl border border-[#800E13] flex items-center gap-2 cursor-pointer shadow-md"
              >
                Complete Setup & Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

export default function NewWebsitePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500 text-xs">Loading setup...</div>}>
      <NewWebsiteContent />
    </Suspense>
  );
}
