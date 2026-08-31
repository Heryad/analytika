"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Settings,
  Code,
  Shield,
  Trash2,
  Copy,
  Check,
  Globe,
  Lock,
  RefreshCcw,
  Plus,
  X,
  AlertTriangle,
  Clock,
  DollarSign,
  Terminal,
  ExternalLink,
  CheckCircle2,
  Server
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

// Custom Toggle Switch Component matching app aesthetics
function Switch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (val: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? "bg-[#800E13]" : "bg-white/[0.12]"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function WebsiteSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const websiteId = (params.websiteId as string) || "1";

  const initialDomain = websiteId === "1" ? "analytika.dev" : websiteId === "2" ? "saasgrowth.io" : "devpulse.com";
  const initialName = websiteId === "1" ? "Analytika Production" : websiteId === "2" ? "SaaS Growth Hub" : "DevPulse App";

  // Top Tabs
  const [activeTab, setActiveTab] = useState<"general" | "snippet" | "filters" | "danger">("general");

  // General Tab State
  const [siteName, setSiteName] = useState(initialName);
  const [initialSavedName, setInitialSavedName] = useState(initialName);
  const [timezone, setTimezone] = useState("UTC (GMT+00:00)");
  const [initialTimezone, setInitialTimezone] = useState("UTC (GMT+00:00)");
  const [currency, setCurrency] = useState("USD ($)");
  const [initialCurrency, setInitialCurrency] = useState("USD ($)");
  const [isSaved, setIsSaved] = useState(false);

  // Public Sharing
  const [isPublic, setIsPublic] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [sharePassword, setSharePassword] = useState("");

  // Tracking Snippet & Proxy State
  const [snippetTab, setSnippetTab] = useState<"html" | "next" | "npm" | "react">("html");
  const [pkgManager, setPkgManager] = useState<"npm" | "pnpm" | "bun" | "yarn">("npm");
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCname, setCopiedCname] = useState(false);
  const [allowLocalhost, setAllowLocalhost] = useState(true);
  const [customProxyDomain, setCustomProxyDomain] = useState(`stats.${initialDomain}`);
  const [isVerifyingProxy, setIsVerifyingProxy] = useState(false);
  const [proxyVerified, setProxyVerified] = useState(true);

  // Filters State
  const [ignoreMyVisits, setIgnoreMyVisits] = useState(true);
  const [blockedIps, setBlockedIps] = useState<string[]>(["192.168.1.1", "10.0.0.0/24"]);
  const [newIp, setNewIp] = useState("");
  const [excludedPaths, setExcludedPaths] = useState<string[]>(["/admin/*", "/preview/*", "/staging/*"]);
  const [newPath, setNewPath] = useState("");

  // Danger Zone State
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");

  // Check if General Form is dirty
  const isGeneralDirty = siteName.trim() !== initialSavedName.trim() || timezone !== initialTimezone || currency !== initialCurrency;

  const handleSaveGeneral = () => {
    setInitialSavedName(siteName);
    setInitialTimezone(timezone);
    setInitialCurrency(currency);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const copyToClipboard = (text: string, type: "snippet" | "key" | "cname") => {
    navigator.clipboard.writeText(text);
    if (type === "snippet") {
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    } else if (type === "key") {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedCname(true);
      setTimeout(() => setCopiedCname(false), 2000);
    }
  };

  const handleAddIp = () => {
    if (newIp.trim() && !blockedIps.includes(newIp.trim())) {
      setBlockedIps([...blockedIps, newIp.trim()]);
      setNewIp("");
    }
  };

  const handleRemoveIp = (ip: string) => {
    setBlockedIps(blockedIps.filter((item) => item !== ip));
  };

  const handleAddPath = () => {
    if (newPath.trim() && !excludedPaths.includes(newPath.trim())) {
      setExcludedPaths([...excludedPaths, newPath.trim()]);
      setNewPath("");
    }
  };

  const handleRemovePath = (p: string) => {
    setExcludedPaths(excludedPaths.filter((item) => item !== p));
  };

  const handleVerifyProxy = () => {
    setIsVerifyingProxy(true);
    setTimeout(() => {
      setIsVerifyingProxy(false);
      setProxyVerified(true);
    }, 1000);
  };

  const snippetCode = `<script defer src="https://analytika.dev/tracker.js" data-site-id="${websiteId}"></script>`;
  const apiKey = `ak_live_${websiteId}_${initialDomain.replace(/[^a-z0-9]/g, "")}_9f28a`;

  return (
    <div className="space-y-6">
      {/* Top Header - Back Button & Site Title */}
      <div className="flex items-center gap-3.5">
        <Link
          href={`/dashboard/${websiteId}`}
          className="text-zinc-400 hover:text-white transition-colors p-2 -ml-1 rounded-xl bg-[#262626] border border-white/[0.08] hover:border-white/[0.15] cursor-pointer"
          title="Back to Analytics"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">
            Project Settings
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5 font-mono">{initialDomain}</p>
        </div>
      </div>

      {/* Top Tabs Bar - Matching Account Settings Design */}
      <div className="flex items-center gap-1.5 border-b border-white/[0.08] pb-3 flex-wrap">
        {[
          { id: "general", label: "General", icon: Settings },
          { id: "snippet", label: "Tracking & Proxy", icon: Code },
          { id: "filters", label: "Filters & Privacy", icon: Shield },
          { id: "danger", label: "Danger Zone", icon: Trash2, danger: true },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                isActive
                  ? tab.danger
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    : "bg-[#262626] text-white border border-white/[0.08]"
                  : tab.danger
                  ? "text-rose-400/80 hover:bg-rose-500/10 hover:text-rose-300"
                  : "text-zinc-400 hover:text-white hover:bg-[#262626]/50"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${tab.danger ? "text-rose-400" : "text-zinc-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: GENERAL */}
      {activeTab === "general" && (
        <div className="max-w-2xl space-y-6">
          {/* Site Profile Card */}
          <div className="rounded-2xl bg-[#262626] border border-white/[0.08] p-5 space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-white/[0.06]">
              <div className="w-14 h-14 rounded-2xl bg-[#1F1F1F] border border-white/[0.08] flex items-center justify-center p-2 shrink-0 relative group shadow-inner">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${initialDomain}&sz=128`}
                  alt={initialDomain}
                  className="w-8 h-8 object-contain rounded-md"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-white truncate">{siteName}</h2>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono mt-0.5">
                  <span>{initialDomain}</span>
                  <a
                    href={`https://${initialDomain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-zinc-500 hover:text-zinc-300"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Site Name & Readonly Domain */}
            <div className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Site Name</label>
                <Input
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="bg-[#1F1F1F] border-white/[0.08] text-white text-sm"
                  placeholder="My Website"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-300">Primary Domain</label>
                  <span className="text-[11px] text-zinc-500 flex items-center gap-1 font-mono">
                    <Lock className="w-3 h-3" /> Permanent identifier
                  </span>
                </div>
                <Input
                  readOnly
                  disabled
                  value={initialDomain}
                  className="bg-[#141414] border-white/[0.06] text-zinc-400 text-sm font-mono cursor-not-allowed select-none opacity-80"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Timezone</span>
                  </label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="bg-[#1F1F1F] border-white/[0.08] text-white text-xs h-10">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC (GMT+00:00)">UTC (GMT+00:00)</SelectItem>
                      <SelectItem value="America/New_York (EST)">America/New_York (EST)</SelectItem>
                      <SelectItem value="America/Los_Angeles (PST)">America/Los_Angeles (PST)</SelectItem>
                      <SelectItem value="Europe/London (GMT)">Europe/London (GMT)</SelectItem>
                      <SelectItem value="Europe/Berlin (CET)">Europe/Berlin (CET)</SelectItem>
                      <SelectItem value="Asia/Dubai (GST)">Asia/Dubai (GST)</SelectItem>
                      <SelectItem value="Asia/Tokyo (JST)">Asia/Tokyo (JST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Currency</span>
                  </label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="bg-[#1F1F1F] border-white/[0.08] text-white text-xs h-10">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD ($)">USD ($)</SelectItem>
                      <SelectItem value="EUR (€)">EUR (€)</SelectItem>
                      <SelectItem value="GBP (£)">GBP (£)</SelectItem>
                      <SelectItem value="CAD ($)">CAD ($)</SelectItem>
                      <SelectItem value="AUD ($)">AUD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
              {isSaved ? (
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Saved successfully
                </span>
              ) : (
                <span />
              )}
              <Button
                disabled={!isGeneralDirty}
                onClick={handleSaveGeneral}
                className="bg-[#800E13] hover:bg-[#800E13]/90 text-white text-xs disabled:opacity-40 disabled:pointer-events-none"
              >
                Save Changes
              </Button>
            </div>
          </div>

          {/* Public Dashboard Card */}
          <div className="rounded-2xl bg-[#262626] border border-white/[0.08] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-zinc-400" />
                  <span>Public Dashboard Sharing</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">Allow anyone with the link to view this site's stats.</p>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>

            {isPublic && (
              <div className="space-y-4 pt-3 border-t border-white/[0.06] animate-in fade-in duration-200">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Public URL</label>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={`https://analytika.dev/share/${initialDomain}`}
                      className="bg-[#1F1F1F] border-white/[0.08] text-zinc-300 text-xs font-mono select-all"
                    />
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(`https://analytika.dev/share/${initialDomain}`, "snippet")}
                      className="border-white/[0.08] hover:bg-white/[0.04] text-white shrink-0 text-xs"
                    >
                      <Copy className="w-3.5 h-3.5 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <div className="text-xs font-medium text-zinc-300">PIN Code Protection</div>
                    <div className="text-[11px] text-zinc-500">Require visitors to enter a PIN to access stats.</div>
                  </div>
                  <Switch checked={hasPassword} onCheckedChange={setHasPassword} />
                </div>

                {hasPassword && (
                  <Input
                    type="password"
                    placeholder="Enter PIN code / password"
                    value={sharePassword}
                    onChange={(e) => setSharePassword(e.target.value)}
                    className="bg-[#1F1F1F] border-white/[0.08] text-white text-sm max-w-xs"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TRACKING & PROXY */}
      {activeTab === "snippet" && (
        <div className="max-w-2xl space-y-6">
          {/* Tracking Snippet & Framework Selector Card */}
          <div className="rounded-2xl bg-[#262626] border border-white/[0.08] p-5 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-white">Tracking & SDK Setup</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Choose your framework or installation method to start collecting stats.
              </p>
            </div>

            {/* Framework Selector Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-[#1A1A1A] border border-white/[0.06] rounded-xl">
              {[
                { id: "html", label: "HTML Script" },
                { id: "next", label: "Next.js" },
                { id: "npm", label: "NPM Package" },
                { id: "react", label: "React / SPA" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSnippetTab(f.id as any)}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer text-center ${
                    snippetTab === f.id
                      ? "bg-[#262626] text-white shadow-sm border border-white/[0.08]"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* NPM Package Manager Selector when NPM is active */}
            {snippetTab === "npm" && (
              <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>1. Install the SDK package:</span>
                  <div className="flex items-center gap-1 bg-[#141414] p-0.5 rounded-lg border border-white/[0.06]">
                    {(["npm", "pnpm", "bun", "yarn"] as const).map((pm) => (
                      <button
                        key={pm}
                        type="button"
                        onClick={() => setPkgManager(pm)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                          pkgManager === pm ? "bg-[#800E13] text-white" : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        {pm}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between bg-[#141414] border border-white/[0.08] rounded-xl px-3.5 py-2.5 font-mono text-xs text-zinc-300">
                  <span>
                    <span className="text-zinc-500">$</span>{" "}
                    {pkgManager === "npm" && "npm install @analytika/sdk"}
                    {pkgManager === "pnpm" && "pnpm add @analytika/sdk"}
                    {pkgManager === "bun" && "bun add @analytika/sdk"}
                    {pkgManager === "yarn" && "yarn add @analytika/sdk"}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      copyToClipboard(
                        pkgManager === "npm"
                          ? "npm install @analytika/sdk"
                          : pkgManager === "pnpm"
                          ? "pnpm add @analytika/sdk"
                          : pkgManager === "bun"
                          ? "bun add @analytika/sdk"
                          : "yarn add @analytika/sdk",
                        "snippet"
                      )
                    }
                    className="h-6 text-[11px] text-zinc-400 hover:text-white px-2 -mr-1"
                  >
                    <Copy className="w-3 h-3 mr-1" /> Copy
                  </Button>
                </div>
                <div className="text-xs text-zinc-400 pt-1">2. Initialize in your code:</div>
              </div>
            )}

            {/* Terminal Window Code Block */}
            <div className="rounded-xl bg-[#141414] border border-white/[0.08] overflow-hidden shadow-inner">
              <div className="flex items-center justify-between px-3.5 py-2 bg-[#1A1A1A] border-b border-white/[0.06]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="text-[11px] font-mono text-zinc-400 ml-2">
                    {snippetTab === "html" && "index.html"}
                    {snippetTab === "next" && "app/layout.tsx"}
                    {snippetTab === "npm" && "src/analytics.ts"}
                    {snippetTab === "react" && "src/App.tsx"}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const codeToCopy =
                      snippetTab === "html"
                        ? `<script defer src="https://analytika.dev/tracker.js" data-site-id="${websiteId}"></script>`
                        : snippetTab === "next"
                        ? `import Script from "next/script";\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang="en">\n      <head>\n        <Script\n          defer\n          src="https://analytika.dev/tracker.js"\n          data-site-id="${websiteId}"\n          strategy="afterInteractive"\n        />\n      </head>\n      <body>{children}</body>\n    </html>\n  );\n}`
                        : snippetTab === "npm"
                        ? `import { Analytika } from "@analytika/sdk";\n\n// Initialize once in your app entry\nAnalytika.init({\n  apiKey: "${apiKey}",\n});\n\n// Track custom events\nAnalytika.track("Sign Up Clicked", { plan: "pro" });`
                        : `import { useEffect } from "react";\nimport { Analytika } from "@analytika/sdk";\n\nexport default function App() {\n  useEffect(() => {\n    Analytika.init({ apiKey: "${apiKey}" });\n  }, []);\n\n  return <div>My App</div>;\n}`;
                    copyToClipboard(codeToCopy, "snippet");
                  }}
                  className="h-7 text-xs text-zinc-300 hover:text-white hover:bg-white/[0.08] px-2.5 cursor-pointer"
                >
                  {copiedSnippet ? (
                    <>
                      <Check className="w-3 h-3 mr-1 text-emerald-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      Copy Code
                    </>
                  )}
                </Button>
              </div>

              {/* Code Content */}
              <div className="p-4 font-mono text-xs text-zinc-300 overflow-x-auto whitespace-pre leading-relaxed">
                {snippetTab === "html" && (
                  <>
                    <span className="text-zinc-500">&lt;!-- Analytika Web Tracker --&gt;</span>{"\n"}
                    <span className="text-rose-400">&lt;script</span>{" "}
                    <span className="text-zinc-400">defer</span>{" "}
                    <span className="text-amber-300">src</span>=
                    <span className="text-emerald-300">&quot;https://analytika.dev/tracker.js&quot;</span>{" "}
                    <span className="text-amber-300">data-site-id</span>=
                    <span className="text-emerald-300">&quot;{websiteId}&quot;</span>
                    <span className="text-rose-400">&gt;&lt;/script&gt;</span>
                  </>
                )}

                {snippetTab === "next" && (
                  <>
                    <span className="text-rose-400">import</span> Script <span className="text-rose-400">from</span> <span className="text-emerald-300">&quot;next/script&quot;</span>;{"\n\n"}
                    <span className="text-rose-400">export default function</span> <span className="text-amber-300">RootLayout</span>({"{"} children {"}"}: {"{"} children: React.ReactNode {"}"}) {"{\n"}
                    {"  "}<span className="text-rose-400">return</span> ({"\n"}
                    {"    "}&lt;<span className="text-rose-400">html</span> <span className="text-amber-300">lang</span>=<span className="text-emerald-300">&quot;en&quot;</span>&gt;{"\n"}
                    {"      "}&lt;<span className="text-rose-400">head</span>&gt;{"\n"}
                    {"        "}&lt;<span className="text-amber-300">Script</span>{"\n"}
                    {"          "}<span className="text-zinc-400">defer</span>{"\n"}
                    {"          "}<span className="text-amber-300">src</span>=<span className="text-emerald-300">&quot;https://analytika.dev/tracker.js&quot;</span>{"\n"}
                    {"          "}<span className="text-amber-300">data-site-id</span>=<span className="text-emerald-300">&quot;{websiteId}&quot;</span>{"\n"}
                    {"          "}<span className="text-amber-300">strategy</span>=<span className="text-emerald-300">&quot;afterInteractive&quot;</span>{"\n"}
                    {"        "}/&gt;{"\n"}
                    {"      "}&lt;/<span className="text-rose-400">head</span>&gt;{"\n"}
                    {"      "}&lt;<span className="text-rose-400">body</span>&gt;{"{"}children{"}"}&lt;/<span className="text-rose-400">body</span>&gt;{"\n"}
                    {"    "}&lt;/<span className="text-rose-400">html</span>&gt;{"\n"}
                    {"  "});{"\n"}
                    {"}"}
                  </>
                )}

                {snippetTab === "npm" && (
                  <>
                    <span className="text-rose-400">import</span> {"{ Analytika }"} <span className="text-rose-400">from</span> <span className="text-emerald-300">&quot;@analytika/sdk&quot;</span>;{"\n\n"}
                    <span className="text-zinc-500">// 1. Initialize in your entry file</span>{"\n"}
                    Analytika.<span className="text-amber-300">init</span>({"{\n"}
                    {"  "}apiKey: <span className="text-emerald-300">&quot;{apiKey}&quot;</span>,{"\n"}
                    {"});\n\n"}
                    <span className="text-zinc-500">// 2. Track custom events anywhere in your app</span>{"\n"}
                    Analytika.<span className="text-amber-300">track</span>(<span className="text-emerald-300">&quot;Sign Up Clicked&quot;</span>, {"{ "}plan: <span className="text-emerald-300">&quot;pro&quot;</span>{" }" });
                  </>
                )}

                {snippetTab === "react" && (
                  <>
                    <span className="text-rose-400">import</span> {"{ useEffect }"} <span className="text-rose-400">from</span> <span className="text-emerald-300">&quot;react&quot;</span>;{"\n"}
                    <span className="text-rose-400">import</span> {"{ Analytika }"} <span className="text-rose-400">from</span> <span className="text-emerald-300">&quot;@analytika/sdk&quot;</span>;{"\n\n"}
                    <span className="text-rose-400">export default function</span> <span className="text-amber-300">App</span>() {"{\n"}
                    {"  "}<span className="text-amber-300">useEffect</span>(() =&gt; {"{\n"}
                    {"    "}Analytika.<span className="text-amber-300">init</span>({"{"} apiKey: <span className="text-emerald-300">&quot;{apiKey}&quot;</span> {"}"});{"\n"}
                    {"  }"}, []);{"\n\n"}
                    {"  "}<span className="text-rose-400">return</span> &lt;<span className="text-rose-400">div</span>&gt;My Application&lt;/<span className="text-rose-400">div</span>&gt;;{"\n"}
                    {"}"}
                  </>
                )}
              </div>
            </div>

            {/* Client API Key */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-medium text-zinc-300">Client API Key (NPM SDK)</label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={apiKey}
                  className="bg-[#141414] border-white/[0.08] text-zinc-300 text-xs font-mono select-all"
                />
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(apiKey, "key")}
                  className="border-white/[0.08] hover:bg-white/[0.04] text-white shrink-0 text-xs"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>

            {/* Localhost Tracking */}
            <div className="flex items-center justify-between py-2 border-t border-white/[0.06]">
              <div>
                <div className="text-xs font-medium text-zinc-200">Track Localhost & Staging</div>
                <div className="text-[11px] text-zinc-500">Record pageviews when developing locally on localhost.</div>
              </div>
              <Switch checked={allowLocalhost} onCheckedChange={setAllowLocalhost} />
            </div>
          </div>

          {/* Custom Domain / Reverse Proxy Card */}
          <div className="rounded-2xl bg-[#262626] border border-white/[0.08] p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-zinc-400" />
              <div>
                <h2 className="text-base font-semibold text-white">Custom Domain Proxy (Ad-Block Bypass)</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Route analytics requests through your own domain to bypass ad-blockers.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#1F1F1F] border border-white/[0.06] space-y-3">
              <div className="text-xs text-zinc-300">
                1. Add a <span className="font-mono text-white bg-white/[0.06] px-1 py-0.5 rounded">CNAME</span> record at your DNS provider:
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-[#141414] border border-white/[0.06]">
                  <div className="text-[10px] text-zinc-500 uppercase">Type</div>
                  <div className="text-white mt-0.5">CNAME</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#141414] border border-white/[0.06]">
                  <div className="text-[10px] text-zinc-500 uppercase">Host</div>
                  <div className="text-white mt-0.5">stats</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#141414] border border-white/[0.06] relative group">
                  <div className="text-[10px] text-zinc-500 uppercase">Target</div>
                  <div className="text-rose-300 mt-0.5 truncate">custom.analytika.dev</div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-medium text-zinc-300">Your Proxy Domain</label>
              <div className="flex items-center gap-2">
                <Input
                  value={customProxyDomain}
                  onChange={(e) => setCustomProxyDomain(e.target.value)}
                  placeholder={`stats.${initialDomain}`}
                  className="bg-[#1F1F1F] border-white/[0.08] text-white text-xs font-mono"
                />
                <Button
                  onClick={handleVerifyProxy}
                  variant="outline"
                  className="border-white/[0.08] hover:bg-white/[0.04] text-xs text-zinc-200 shrink-0"
                >
                  <RefreshCcw className={`w-3.5 h-3.5 mr-1.5 ${isVerifyingProxy ? "animate-spin text-rose-400" : ""}`} />
                  Verify DNS
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FILTERS & PRIVACY */}
      {activeTab === "filters" && (
        <div className="max-w-2xl space-y-6">
          {/* Exclude My Visits */}
          <div className="rounded-2xl bg-[#262626] border border-white/[0.08] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">Exclude My Own Visits</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Sets a local exclusion cookie in this browser so your testing is never recorded.</p>
              </div>
              <Switch checked={ignoreMyVisits} onCheckedChange={setIgnoreMyVisits} />
            </div>
          </div>

          {/* Excluded Paths */}
          <div className="rounded-2xl bg-[#262626] border border-white/[0.08] p-5 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-white">Excluded URL Paths</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Ignore internal routes or test pages (supports wildcards *).</p>
            </div>

            <div className="flex items-center gap-2">
              <Input
                placeholder="/admin/* or /checkout/test"
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddPath()}
                className="bg-[#1F1F1F] border-white/[0.08] text-white text-xs font-mono"
              />
              <Button onClick={handleAddPath} size="sm" className="bg-[#800E13] hover:bg-[#800E13]/90 text-white text-xs shrink-0">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Path
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {excludedPaths.map((p) => (
                <span key={p} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#1F1F1F] border border-white/[0.08] text-xs font-mono text-zinc-300">
                  <span>{p}</span>
                  <button onClick={() => handleRemovePath(p)} className="text-zinc-500 hover:text-white cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Blocked IP Addresses */}
          <div className="rounded-2xl bg-[#262626] border border-white/[0.08] p-5 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-white">Blocked IP Addresses & CIDR</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Filter out internal office networks or bot IP addresses.</p>
            </div>

            <div className="flex items-center gap-2">
              <Input
                placeholder="192.168.1.1 or 10.0.0.0/24"
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddIp()}
                className="bg-[#1F1F1F] border-white/[0.08] text-white text-xs font-mono"
              />
              <Button onClick={handleAddIp} size="sm" className="bg-[#800E13] hover:bg-[#800E13]/90 text-white text-xs shrink-0">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add IP
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {blockedIps.map((ip) => (
                <span key={ip} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#1F1F1F] border border-white/[0.08] text-xs font-mono text-zinc-300">
                  <span>{ip}</span>
                  <button onClick={() => handleRemoveIp(ip)} className="text-zinc-500 hover:text-white cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DANGER ZONE */}
      {activeTab === "danger" && (
        <div className="max-w-2xl space-y-6">
          {/* Reset Data */}
          <div className="rounded-2xl bg-[#262626] border border-rose-500/20 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Reset Analytics Data</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">Wipes all collected pageviews, funnels, and events while keeping settings intact.</p>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 text-xs">
                    Reset All Data
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#1F1F1F] border-white/[0.08] text-white max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-rose-400 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Reset Analytics Data?
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400 text-xs mt-2">
                      This action will permanently delete all historic pageviews and events for <strong>{initialDomain}</strong>. This cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end gap-2.5 mt-4">
                    <Button variant="ghost" className="text-zinc-400 hover:text-white text-xs">
                      Cancel
                    </Button>
                    <Button className="bg-rose-600 hover:bg-rose-700 text-white text-xs">
                      Yes, Reset Data
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Delete Project */}
          <div className="rounded-2xl bg-[#262626] border border-rose-500/30 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-rose-400 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Website</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">Permanently remove this project and all associated analytics.</p>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-rose-600 hover:bg-rose-700 text-white text-xs">
                    Delete Website
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#1F1F1F] border-white/[0.08] text-white max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-rose-400 flex items-center gap-2">
                      <Trash2 className="w-5 h-5" />
                      Permanently Delete {initialDomain}?
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400 text-xs mt-2">
                      Type <strong>{initialDomain}</strong> below to confirm deletion.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3 mt-3">
                    <Input
                      placeholder={`Type "${initialDomain}" to confirm`}
                      value={deleteConfirmInput}
                      onChange={(e) => setDeleteConfirmInput(e.target.value)}
                      className="bg-[#141414] border-white/[0.08] text-white text-xs font-mono"
                    />
                  </div>

                  <div className="flex justify-end gap-2.5 mt-4">
                    <Button variant="ghost" className="text-zinc-400 hover:text-white text-xs">
                      Cancel
                    </Button>
                    <Button
                      disabled={deleteConfirmInput !== initialDomain}
                      onClick={() => router.push("/dashboard")}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs disabled:opacity-50"
                    >
                      I understand, delete this site
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
