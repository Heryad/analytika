"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  ChevronDown, 
  Settings, 
  Bot, 
  CreditCard, 
  LogOut 
} from "lucide-react";
import { NotificationBanner } from "@/components/notification-banner";

export function DashboardHeader() {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<{ email: string; name?: string }>({
    email: "founder@analytika.dev",
    name: "Heryad",
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load user from localStorage if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("analytika_user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUser((prev) => ({
            ...prev,
            email: parsed.email || prev.email,
            name: parsed.name || (parsed.email ? parsed.email.split("@")[0] : prev.name),
          }));
        } catch {
          // ignore
        }
      }
    }
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sign out handler
  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("analytika_user");
    }
    router.push("/auth/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full flex flex-col bg-[#1F1F1F]">
      
      {/* Reusable Centered Warning / Notification Banner */}
      <NotificationBanner
        message="14 days left in your Pro trial. Upgrade to keep unlimited analytics and revenue tracking."
        linkText="Pick a plan"
        href="/dashboard/settings?tab=billing"
        type="accent"
      />

      {/* Main Navigation Bar */}
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Brand Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 transition-opacity hover:opacity-90">
          <Image
            src="/logo.svg"
            alt="Analytika Logo"
            width={36}
            height={36}
            className="w-9 h-9 object-contain"
            priority
          />
          <span className="text-xl font-bold tracking-tight text-white">
            Analytika
          </span>
        </Link>

        {/* Right: User Profile & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-3 rounded-xl bg-[#262626] border border-white/[0.08] hover:border-white/20 p-1.5 pr-3 transition-all cursor-pointer shadow-xs"
          >
            {/* User Profile Avatar with Unavatar or fallback */}
            <img
              src="https://unavatar.io/x/heryad_"
              alt={user.name || "User Avatar"}
              className="h-8 w-8 rounded-lg object-cover bg-[#1F1F1F] border border-white/[0.06] shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <div className="text-left hidden sm:block">
              <span className="text-xs font-semibold text-white block leading-none">
                {user.name || "Heryad"}
              </span>
              <span className="text-[11px] text-zinc-500 font-mono block mt-0.5 leading-none">
                Founder Pro
              </span>
            </div>
            <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </button>

          {/* User Profile Dropdown Menu */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-xl bg-[#262626] border border-white/[0.1] shadow-2xl p-1.5 space-y-1 text-xs text-zinc-300 animate-in fade-in zoom-in-95 duration-150 z-50">
              
              {/* Profile Header */}
              <div className="px-3 py-2.5 bg-[#1F1F1F] rounded-lg border border-white/[0.04] space-y-0.5">
                <span className="font-semibold text-white block truncate text-sm">
                  {user.name || "Heryad"}
                </span>
                <span className="text-zinc-400 font-mono text-[11px] block truncate">
                  {user.email}
                </span>
              </div>

              <div className="border-t border-white/[0.06] my-1" />

              {/* Navigation Items */}
              <Link
                href="/dashboard/settings?tab=general"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#2d2d2d] hover:text-white transition-colors"
              >
                <Settings className="h-4 w-4 text-zinc-400" />
                <span>Settings</span>
              </Link>

              <Link
                href="/dashboard/settings?tab=mcp"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#2d2d2d] hover:text-white transition-colors"
              >
                <Bot className="h-4 w-4 text-zinc-400" />
                <span>MCP AI Server</span>
              </Link>

              <Link
                href="/dashboard/settings?tab=billing"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#2d2d2d] hover:text-white transition-colors"
              >
                <CreditCard className="h-4 w-4 text-zinc-400" />
                <span>Billing & Plan</span>
              </Link>

              <div className="border-t border-white/[0.06] my-1" />

              {/* Sign Out Button */}
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-400 hover:bg-[#2d2d2d] hover:text-white transition-colors text-left cursor-pointer"
              >
                <LogOut className="h-4 w-4 text-zinc-400" />
                <span>Sign Out</span>
              </button>

            </div>
          )}

        </div>

      </div>

    </header>
  );
}
