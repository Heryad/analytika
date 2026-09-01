"use client";

import { useState, useEffect } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DashboardHeader() {
  const router = useRouter();

  const [user, setUser] = useState<{ email: string; name?: string }>({
    email: "founder@analytika.dev",
    name: "Heryad",
  });

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
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-3 rounded-xl bg-[#262626] border border-white/[0.08] hover:border-white/20 p-1.5 pr-3 transition-all cursor-pointer shadow-xs outline-none"
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
              <ChevronDown className="h-4 w-4 text-zinc-400 transition-transform duration-200" />
            </button>
          </DropdownMenuTrigger>

          {/* User Profile Dropdown Menu */}
          <DropdownMenuContent align="end" className="w-60 bg-[#262626] border-white/[0.1] text-zinc-300 p-1.5 shadow-2xl rounded-xl">
            {/* Profile Header */}
            <div className="px-3 py-2.5 bg-[#1F1F1F] rounded-lg border border-white/[0.04] space-y-0.5 mb-1">
              <span className="font-semibold text-white block truncate text-sm">
                {user.name || "Heryad"}
              </span>
              <span className="text-zinc-400 font-mono text-[11px] block truncate">
                {user.email}
              </span>
            </div>

            <DropdownMenuSeparator className="bg-white/[0.06]" />

            {/* Navigation Items */}
            <DropdownMenuItem asChild className="cursor-pointer hover:bg-[#2d2d2d] hover:text-white rounded-lg px-3 py-2 text-xs">
              <Link href="/dashboard/settings?tab=general" className="flex items-center gap-2.5 w-full">
                <Settings className="h-4 w-4 text-zinc-400" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild className="cursor-pointer hover:bg-[#2d2d2d] hover:text-white rounded-lg px-3 py-2 text-xs">
              <Link href="/dashboard/settings?tab=mcp" className="flex items-center gap-2.5 w-full">
                <Bot className="h-4 w-4 text-zinc-400" />
                <span>MCP AI Server</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild className="cursor-pointer hover:bg-[#2d2d2d] hover:text-white rounded-lg px-3 py-2 text-xs">
              <Link href="/dashboard/settings?tab=billing" className="flex items-center gap-2.5 w-full">
                <CreditCard className="h-4 w-4 text-zinc-400" />
                <span>Billing & Plan</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-white/[0.06]" />

            {/* Sign Out Button */}
            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-lg px-3 py-2 text-xs flex items-center gap-2.5"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>

    </header>
  );
}
