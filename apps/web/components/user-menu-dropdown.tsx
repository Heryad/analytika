"use client";

import Link from "next/link";
import { ChevronDown, Settings, Bot, CreditCard, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export function UserMenuDropdown({ initialUser }: { initialUser: UserProfile | null }) {
  const { user: clientUser, logout } = useAuth();
  const user = clientUser || initialUser;

  if (!user) {
    return (
      <Link
        href="/auth/login"
        className="text-xs font-semibold text-white bg-[#800E13] hover:bg-[#9e1218] px-3.5 py-2 rounded-xl transition-all shadow-md"
      >
        Sign In
      </Link>
    );
  }

  const displayName = user.name || (user.email ? user.email.split("@")[0] : "Founder");
  const displayEmail = user.email || "";
  const initialLetter = displayName
    ? displayName.charAt(0).toUpperCase()
    : displayEmail
    ? displayEmail.charAt(0).toUpperCase()
    : "A";
  const planLabel = user.plan === "solo" ? "Solo Plan" : "Growth Plan";

  const handleSignOut = async () => {
    await logout();
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2.5 rounded-xl bg-[#262626] border border-white/[0.08] hover:border-white/20 p-1.5 pr-3 transition-all cursor-pointer shadow-xs outline-none"
        >
          {/* User Initials Avatar or Profile Image */}
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={displayName}
              className="h-8 w-8 rounded-lg object-cover bg-[#1F1F1F] border border-white/[0.06] shrink-0"
            />
          ) : (
            <div className="h-8 w-8 rounded-lg bg-[#800E13] border border-white/[0.1] text-white font-bold text-xs flex items-center justify-center shrink-0">
              {initialLetter}
            </div>
          )}

          <div className="text-left hidden sm:block">
            <span className="text-xs font-semibold text-white block leading-none truncate max-w-[120px]">
              {displayName}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono block mt-0.5 leading-none">
              {planLabel}
            </span>
          </div>

          <ChevronDown className="h-3.5 w-3.5 text-zinc-400 transition-transform duration-200" />
        </button>
      </DropdownMenuTrigger>

      {/* User Profile Dropdown Menu */}
      <DropdownMenuContent
        align="end"
        className="w-60 bg-[#262626] border-white/[0.1] text-zinc-300 p-1.5 shadow-2xl rounded-xl"
      >
        {/* Profile Header */}
        <div className="px-3 py-2.5 bg-[#1F1F1F] rounded-lg border border-white/[0.04] space-y-0.5 mb-1">
          <span className="font-semibold text-white block truncate text-sm">
            {displayName}
          </span>
          <span className="text-zinc-400 font-mono text-[11px] block truncate">
            {displayEmail}
          </span>
        </div>

        <DropdownMenuSeparator className="bg-white/[0.06]" />

        {/* Navigation Items */}
        <DropdownMenuItem
          asChild
          className="cursor-pointer hover:bg-[#2d2d2d] hover:text-white rounded-lg px-3 py-2 text-xs"
        >
          <Link href="/dashboard/settings?tab=general" className="flex items-center gap-2.5 w-full">
            <Settings className="h-4 w-4 text-zinc-400" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          asChild
          className="cursor-pointer hover:bg-[#2d2d2d] hover:text-white rounded-lg px-3 py-2 text-xs"
        >
          <Link href="/dashboard/settings?tab=mcp" className="flex items-center gap-2.5 w-full">
            <Bot className="h-4 w-4 text-zinc-400" />
            <span>MCP AI Server</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          asChild
          className="cursor-pointer hover:bg-[#2d2d2d] hover:text-white rounded-lg px-3 py-2 text-xs"
        >
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
  );
}
