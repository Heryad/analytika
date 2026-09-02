"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft,
  User, 
  Bot, 
  CreditCard, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  RotateCw, 
  Trash2, 
  LogOut, 
  Moon, 
  Sun, 
  Monitor, 
  Sparkles,
  AlertTriangle,
  X
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
import { useAuth } from "@/lib/auth-context";
import { authApi, UserProfile } from "@/lib/api";
import { applyTheme } from "@/lib/theme";

// Modern Toggle Switch Component
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

function AnimatedPrice({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const currentRef = useRef(value);

  useEffect(() => {
    if (currentRef.current === value) return;
    const start = currentRef.current;
    const end = value;
    const startTime = performance.now();
    const duration = 250;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * ease);
      currentRef.current = current;
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <span className="tabular-nums font-mono">{displayValue.toLocaleString()}</span>;
}

interface SettingsClientProps {
  initialUser: UserProfile | null;
}

export function SettingsClient({ initialUser }: SettingsClientProps) {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab");
  const { user: authUser, refreshUser, logout, updateUser } = useAuth();
  const user = authUser || initialUser;

  // Pure local React state - zero router jumps on tab clicks
  const [activeTab, setActiveTab] = useState<"general" | "mcp" | "billing">(
    urlTab === "billing" ? "billing" : urlTab === "mcp" ? "mcp" : "general"
  );

  // Sync initial tab if URL query changes
  useEffect(() => {
    if (urlTab === "billing" || urlTab === "mcp" || urlTab === "general") {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  // General tab states - initialized directly from server-rendered initialUser
  const [initialName, setInitialName] = useState(initialUser?.name || authUser?.name || "");
  const [fullName, setFullName] = useState(initialUser?.name || authUser?.name || "");
  const [initialEmail, setInitialEmail] = useState(initialUser?.email || authUser?.email || "");
  const [email, setEmail] = useState(initialUser?.email || authUser?.email || "");
  const [theme, setTheme] = useState<"dark" | "system" | "light">(
    initialUser?.theme || authUser?.theme || "dark"
  );
  const [emailDigest, setEmailDigest] = useState(
    initialUser?.emailDigest !== undefined
      ? initialUser.emailDigest
      : authUser?.emailDigest !== undefined
      ? authUser.emailDigest
      : true
  );
  const [productAnnouncements, setProductAnnouncements] = useState(
    initialUser?.productAnnouncements !== undefined
      ? initialUser.productAnnouncements
      : authUser?.productAnnouncements !== undefined
      ? authUser.productAnnouncements
      : true
  );
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Ensure initial theme is applied immediately on mount
  useEffect(() => {
    applyTheme(theme);
  }, []);

  // Sync state once on mount when client authUser hydrates
  const isHydratedRef = useRef(false);
  useEffect(() => {
    if (isHydratedRef.current) return;
    if (authUser) {
      isHydratedRef.current = true;
      if (authUser.name && !fullName) {
        setFullName(authUser.name);
        setInitialName(authUser.name);
      }
      if (authUser.email && !email) {
        setEmail(authUser.email);
        setInitialEmail(authUser.email);
      }
      if (authUser.theme && !initialUser?.theme) {
        setTheme(authUser.theme);
        applyTheme(authUser.theme);
      }
      if (authUser.emailDigest !== undefined && initialUser?.emailDigest === undefined) {
        setEmailDigest(authUser.emailDigest);
      }
      if (authUser.productAnnouncements !== undefined && initialUser?.productAnnouncements === undefined) {
        setProductAnnouncements(authUser.productAnnouncements);
      }
    }
  }, [authUser]);

  const isProfileDirty = fullName.trim() !== initialName.trim();

  // MCP tab states
  const [mcpToken, setMcpToken] = useState(user?.mcpApiKey || "ana_mcp_live_948a29b01c3e882f0199e");
  const [showToken, setShowToken] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Billing tab states
  const [annual, setAnnual] = useState(true);
  const [sliderIndex, setSliderIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const tiers = [
    { events: 10_000, label: "10k", starterM: 7, starterA: 5.5, proM: 15, proA: 12 },
    { events: 100_000, label: "100k", starterM: 19, starterA: 15, proM: 39, proA: 31 },
    { events: 500_000, label: "500k", starterM: 49, starterA: 39, proM: 89, proA: 71 },
    { events: 2_000_000, label: "2m", starterM: 119, starterA: 95, proM: 189, proA: 151 },
    { events: 5_000_000, label: "5m", starterM: 199, starterA: 159, proM: 299, proA: 239 },
    { events: 20_000_000, label: "20m", starterM: 349, starterA: 279, proM: 549, proA: 439 },
  ];

  const currentTier = tiers[sliderIndex];
  const starterPrice = annual ? currentTier.starterA : currentTier.starterM;
  const proPrice = annual ? currentTier.proA : currentTier.proM;
  const visualPercentage = 16 + (sliderIndex / (tiers.length - 1)) * 84;

  const updateStageFromPointer = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const rawRatio = (clientX - rect.left) / rect.width;
    const clamped = Math.max(0, Math.min(1, rawRatio));
    const stepCount = tiers.length - 1;
    let index = 0;
    if (clamped > 0.1) {
      index = Math.round(((clamped - 0.16) / 0.84) * stepCount);
      index = Math.max(0, Math.min(stepCount, index));
    }
    setSliderIndex(index);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isProfileDirty || isSaving) return;
    setIsSaving(true);
    try {
      const res = await authApi.updateProfile({ name: fullName.trim() });
      if (res.success && res.user) {
        setInitialName(fullName.trim());
        updateUser({ name: fullName.trim() });
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    } catch (err) {
      console.error("Failed to update profile", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleThemeChange = (newTheme: "dark" | "system" | "light") => {
    // Instant 0ms synchronous UI + DOM switch
    setTheme(newTheme);
    applyTheme(newTheme);
    updateUser({ theme: newTheme });

    // Non-blocking persistent update in background
    authApi.updateProfile({ theme: newTheme }).catch((err) => {
      console.error("Failed to persist theme", err);
    });
  };

  const handleEmailDigestChange = (checked: boolean) => {
    setEmailDigest(checked);
    updateUser({ emailDigest: checked });
    authApi.updateProfile({ emailDigest: checked }).catch((err) => {
      console.error("Failed to update email digest", err);
    });
  };

  const handleProductAnnouncementsChange = (checked: boolean) => {
    setProductAnnouncements(checked);
    updateUser({ productAnnouncements: checked });
    authApi.updateProfile({ productAnnouncements: checked }).catch((err) => {
      console.error("Failed to update product announcements", err);
    });
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const res = await authApi.deleteAccount();
      if (res.success) {
        await logout();
        window.location.href = "/auth/login";
      }
    } catch (err) {
      console.error("Failed to delete account", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    window.location.href = "/auth/login";
  };

  const mcpConfigJson = JSON.stringify(
    {
      mcpServers: {
        analytika: {
          command: "npx",
          args: ["-y", "@analytika/mcp-server"],
          env: {
            ANALYTIKA_API_KEY: mcpToken,
          },
        },
      },
    },
    null,
    2
  );

  return (
    <div className="space-y-6">
      
      {/* Settings Title with Back Button */}
      <div className="flex items-center gap-3">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-9 w-9 p-0 bg-[#1F1F1F] border-white/[0.08] hover:bg-[#262626] hover:border-white/[0.15] text-zinc-400 hover:text-white rounded-xl cursor-pointer shrink-0"
          title="Back to Dashboard"
        >
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">
          Settings
        </h1>
      </div>

      {/* Tabs Navigation - General & Billing */}
      <div className="flex items-center gap-1.5 border-b border-white/[0.08] pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "general"
              ? "bg-[#262626] text-white border border-white/[0.08]"
              : "text-zinc-400 hover:text-white hover:bg-[#262626]/50"
          }`}
        >
          <User className="h-3.5 w-3.5 text-zinc-400" />
          General
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("billing")}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "billing"
              ? "bg-[#262626] text-white border border-white/[0.08]"
              : "text-zinc-400 hover:text-white hover:bg-[#262626]/50"
          }`}
        >
          <CreditCard className="h-3.5 w-3.5 text-zinc-400" />
          Billing
        </button>
      </div>

      {/* TAB 1: GENERAL */}
      {activeTab === "general" && (
        <div className="max-w-2xl space-y-5">
          
          {/* Profile Card */}
          <div className="rounded-2xl bg-[#262626] border border-white/[0.08] p-5 space-y-4">
            <div className="flex items-center gap-3.5 pb-2 border-b border-white/[0.04]">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Avatar"
                  className="w-11 h-11 rounded-xl object-cover bg-[#1F1F1F] border border-white/[0.08] shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-[#800E13] border border-white/[0.08] text-white font-bold text-base flex items-center justify-center shrink-0">
                  {(fullName || email || "A").charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-sm font-bold text-white leading-tight">
                  {fullName || "Founder"}
                </h2>
                <span className="text-xs text-zinc-500 font-mono block mt-0.5">
                  {email}
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-2">
              <label className="text-xs font-medium text-zinc-300 block text-left">
                Full Name
              </label>

              {/* Single row with User icon and persistent Save button */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 flex items-center">
                  <User className="absolute left-3.5 h-4 w-4 text-zinc-500 pointer-events-none" />
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="pl-10 h-10 bg-[#1F1F1F] border-white/[0.08] text-white rounded-xl text-xs focus-visible:ring-1 focus-visible:ring-[#800E13]"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={!isProfileDirty || isSaving}
                  className="bg-[#800E13] hover:bg-[#9e1218] text-white font-medium text-xs px-4 h-10 rounded-xl transition-all border border-[#800E13] disabled:opacity-40 disabled:pointer-events-none cursor-pointer shrink-0"
                >
                  {isSaving ? "Saving..." : savedSuccess ? "Saved" : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>

          {/* Theme Row */}
          <div className="rounded-2xl bg-[#262626] border border-white/[0.08] p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-white block">Theme</span>
              <span className="text-[11px] text-zinc-500 font-mono block">Color scheme</span>
            </div>

            <div className="inline-flex items-center gap-1 rounded-xl bg-[#1F1F1F] p-1 border border-white/[0.06]">
              <button
                type="button"
                onClick={() => handleThemeChange("dark")}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  theme === "dark" ? "bg-[#262626] text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                <Moon className="h-3 w-3" />
                Dark
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange("system")}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  theme === "system" ? "bg-[#262626] text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                <Monitor className="h-3 w-3" />
                System
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange("light")}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  theme === "light" ? "bg-[#262626] text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                <Sun className="h-3 w-3" />
                Light
              </button>
            </div>
          </div>

          {/* Clean Notifications Section */}
          <div className="rounded-2xl bg-[#262626] border border-white/[0.08] p-5 space-y-4">
            <span className="text-xs font-semibold text-white block">Notifications</span>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-1">
                <div>
                  <span className="text-xs font-medium text-zinc-200 block">Weekly Digest</span>
                  <span className="text-[11px] text-zinc-500 font-mono block">Weekly summary of traffic and revenue</span>
                </div>
                <Switch checked={emailDigest} onCheckedChange={handleEmailDigestChange} />
              </div>

              <div className="border-t border-white/[0.04]" />

              <div className="flex items-center justify-between py-1">
                <div>
                  <span className="text-xs font-medium text-zinc-200 block">Product Updates</span>
                  <span className="text-[11px] text-zinc-500 font-mono block">New features and MCP tools announcements</span>
                </div>
                <Switch checked={productAnnouncements} onCheckedChange={handleProductAnnouncementsChange} />
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="rounded-2xl bg-[#262626] border border-white/[0.08] p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-white block">Account</span>
              <span className="text-[11px] text-zinc-500 font-mono block">Session and account management</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleSignOut}
                className="border-white/[0.08] hover:bg-[#2d2d2d] text-zinc-300 h-8 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5 text-zinc-400" />
                Sign Out
              </Button>

              <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 h-8 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </DialogTrigger>

                <DialogContent className="bg-[#262626] border-white/[0.1] text-zinc-100 sm:max-w-md rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-rose-400" />
                      Delete Account
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400 text-xs mt-1">
                      This will permanently delete your account and all tracked data. This cannot be undone.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="flex justify-end gap-2 pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDeleteOpen(false)}
                      className="border-white/[0.08] hover:bg-[#2d2d2d] text-zinc-300 h-8 rounded-xl text-xs cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      disabled={isDeleting}
                      onClick={handleDeleteAccount}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-medium h-8 rounded-xl text-xs px-3 cursor-pointer disabled:opacity-50"
                    >
                      {isDeleting ? "Deleting..." : "Confirm"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: MCP SERVER */}
      {activeTab === "mcp" && (
        <div className="max-w-2xl space-y-5">
          
          {/* Server Connection Info */}
          <div className="rounded-2xl bg-[#262626] border border-white/[0.08] p-5 space-y-4">
            <h2 className="text-xs font-semibold text-white">
              MCP Server Endpoint
            </h2>

            <div className="space-y-1 text-left">
              <label className="text-xs text-zinc-400">
                SSE Endpoint URL
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  readOnly
                  value="https://mcp.analytika.dev/v1/sse"
                  className="h-9 bg-[#1F1F1F] border-white/[0.08] text-zinc-300 font-mono text-xs rounded-xl"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleCopy("https://mcp.analytika.dev/v1/sse", "endpoint")}
                  className="border-white/[0.08] hover:bg-[#2d2d2d] text-zinc-300 h-9 px-3 rounded-xl shrink-0 cursor-pointer"
                >
                  {copiedField === "endpoint" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-zinc-400" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-1 text-left">
              <div className="flex items-center justify-between">
                <label className="text-xs text-zinc-400">
                  Personal Access Token
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const newToken = `ana_mcp_live_${Math.random().toString(36).substring(2, 18)}`;
                    setMcpToken(newToken);
                  }}
                  className="text-[11px] font-mono text-rose-300 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <RotateCw className="h-3 w-3" />
                  Regenerate
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  type={showToken ? "text" : "password"}
                  readOnly
                  value={mcpToken}
                  className="h-9 bg-[#1F1F1F] border-white/[0.08] text-zinc-300 font-mono text-xs rounded-xl"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowToken(!showToken)}
                  className="border-white/[0.08] hover:bg-[#2d2d2d] text-zinc-300 h-9 px-2.5 rounded-xl shrink-0 cursor-pointer"
                >
                  {showToken ? (
                    <EyeOff className="h-3.5 w-3.5 text-zinc-400" />
                  ) : (
                    <Eye className="h-3.5 w-3.5 text-zinc-400" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleCopy(mcpToken, "token")}
                  className="border-white/[0.08] hover:bg-[#2d2d2d] text-zinc-300 h-9 px-3 rounded-xl shrink-0 cursor-pointer"
                >
                  {copiedField === "token" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-zinc-400" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Client Configuration */}
          <div className="rounded-2xl bg-[#262626] border border-white/[0.08] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-semibold text-white">
                  Client Configuration
                </h2>
                <span className="text-[11px] text-zinc-500 font-mono block">
                  For Claude Desktop & Cursor
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleCopy(mcpConfigJson, "config")}
                className="border-white/[0.08] hover:bg-[#2d2d2d] text-zinc-300 h-7 px-2.5 rounded-lg text-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copiedField === "config" ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 text-zinc-400" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>

            <pre className="p-3 rounded-xl bg-[#1F1F1F] border border-white/[0.04] text-zinc-300 font-mono text-xs overflow-x-auto">
              <code>{mcpConfigJson}</code>
            </pre>
          </div>

          {/* Available Tools */}
          <div className="rounded-2xl bg-[#262626] border border-white/[0.08] p-5 space-y-2">
            <h2 className="text-xs font-semibold text-white mb-2">
              Available MCP Tools
            </h2>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-[#1F1F1F] border border-white/[0.04] flex items-center justify-between">
                <span className="text-white">get_realtime_visitors</span>
                <span className="text-zinc-500">Live visitors count</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#1F1F1F] border border-white/[0.04] flex items-center justify-between">
                <span className="text-white">query_pageviews</span>
                <span className="text-zinc-500">Pageviews by date/source</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#1F1F1F] border border-white/[0.04] flex items-center justify-between">
                <span className="text-white">get_attributed_revenue</span>
                <span className="text-zinc-500">Revenue by referrer & campaign</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: BILLING */}
      {activeTab === "billing" && (
        <div className="max-w-3xl space-y-6">
          
          {/* Active Trial Notice */}
          <div className="rounded-2xl bg-[#262626] border border-[#800E13]/40 p-5 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                <h2 className="text-sm font-bold text-white">
                  Pro Plan Trial Active
                </h2>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                14 days remaining in your free trial.
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] text-zinc-400 font-mono uppercase block">Days Left</span>
              <span className="text-xl font-bold font-mono text-white">14</span>
            </div>
          </div>

          {/* Pricing Controls Slider */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
            
            {/* Slider */}
            <div className="flex-1 w-full flex items-center gap-3">
              <span className="text-xs font-mono text-zinc-400 font-semibold shrink-0">
                10K
              </span>

              <div 
                ref={trackRef}
                onPointerDown={(e) => {
                  setIsDragging(true);
                  e.currentTarget.setPointerCapture(e.pointerId);
                  updateStageFromPointer(e.clientX);
                }}
                onPointerMove={(e) => {
                  if (isDragging) updateStageFromPointer(e.clientX);
                }}
                onPointerUp={(e) => {
                  setIsDragging(false);
                  try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
                }}
                className="relative flex-1 flex items-center h-8 cursor-pointer touch-none"
              >
                <div
                  className="absolute -top-8 -translate-x-1/2 pointer-events-none z-20"
                  style={{ left: `${visualPercentage}%` }}
                >
                  <div className="bg-[#800E13] text-white text-[11px] font-mono font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap">
                    Up to {currentTier.label.toLowerCase()} events
                  </div>
                </div>

                <div className="relative w-full h-3 rounded-full bg-[#262626] border border-white/[0.08] flex items-center overflow-visible">
                  <div
                    className="h-full bg-gradient-to-r from-[#800E13] via-[#9e1218] to-[#be123c] rounded-full"
                    style={{ width: `${visualPercentage}%` }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white border-3 border-[#800E13] shadow-md pointer-events-none z-10"
                    style={{ left: `${visualPercentage}%` }}
                  />
                </div>
              </div>

              <span className="text-xs font-mono text-zinc-400 font-semibold shrink-0">
                20M
              </span>
            </div>

            {/* Monthly / Annual Toggle */}
            <div className="inline-flex items-center gap-1 rounded-lg bg-[#262626] p-1 border border-white/[0.08] shrink-0">
              <button
                type="button"
                onClick={() => setAnnual(false)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  !annual ? "bg-[#800E13] text-white shadow-xs" : "text-zinc-400 hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setAnnual(true)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                  annual ? "bg-[#800E13] text-white shadow-xs" : "text-zinc-400 hover:text-white"
                }`}
              >
                Annual
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded font-bold">
                  -20%
                </span>
              </button>
            </div>

          </div>

          {/* 2 Plan Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
            
            {/* Starter */}
            <div className="flex flex-col justify-between rounded-xl bg-[#262626] border border-white/[0.08] p-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-white">Starter</h3>
                  <span className="text-[10px] font-mono text-zinc-400 bg-[#1F1F1F] px-1.5 py-0.5 rounded border border-white/[0.06]">
                    Solo
                  </span>
                </div>

                <div className="mb-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white tracking-tight">
                    $<AnimatedPrice value={starterPrice} />
                  </span>
                  <span className="text-xs text-zinc-400">/mo</span>
                </div>

                <div className="pt-3 border-t border-white/[0.06] space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Check className="h-3.5 w-3.5 text-[#800E13] shrink-0" />
                    <span><AnimatedPrice value={currentTier.events} /> events/mo</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Check className="h-3.5 w-3.5 text-[#800E13] shrink-0" />
                    <span>1 website</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Check className="h-3.5 w-3.5 text-[#800E13] shrink-0" />
                    <span>30-day retention</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-500">
                    <X className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                    <span>No MCP AI Server</span>
                  </div>
                </div>
              </div>

              <div className="pt-5">
                <Button
                  type="button"
                  className="w-full bg-[#1F1F1F] hover:bg-[#222222] text-white border border-white/[0.1] font-medium h-9 text-xs cursor-pointer"
                >
                  Downgrade to Starter
                </Button>
              </div>
            </div>

            {/* Pro */}
            <div className="relative flex flex-col justify-between rounded-xl bg-[#262626] border-2 border-[#800E13] p-5 shadow-lg">
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                <span className="bg-[#800E13] text-white font-semibold text-[10px] px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Trial Active
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-white">Pro</h3>
                  <span className="text-[10px] font-mono text-rose-300 bg-[#800E13]/20 px-1.5 py-0.5 rounded border border-[#800E13]/30">
                    Full Suite
                  </span>
                </div>

                <div className="mb-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white tracking-tight">
                    $<AnimatedPrice value={proPrice} />
                  </span>
                  <span className="text-xs text-zinc-400">/mo</span>
                </div>

                <div className="pt-3 border-t border-white/[0.06] space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-zinc-200 font-medium">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span><AnimatedPrice value={currentTier.events} /> events/mo</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-200 font-medium">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Unlimited websites</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-200 font-medium">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>MCP AI Server</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-200">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Revenue attribution</span>
                  </div>
                </div>
              </div>

              <div className="pt-5">
                <Button
                  type="button"
                  className="w-full bg-[#800E13] hover:bg-[#9e1218] text-white border border-[#800E13] font-medium h-9 text-xs shadow-sm cursor-pointer"
                >
                  Upgrade & Keep Pro
                </Button>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
