"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface NotificationBannerProps {
  message: string;
  linkText?: string;
  href?: string;
  type?: "accent" | "warning" | "info" | "emerald";
}

export function NotificationBanner({
  message,
  linkText,
  href,
  type = "accent",
}: NotificationBannerProps) {
  const typeStyles = {
    accent: "bg-[#241315] border-[#800E13]/30 text-zinc-200",
    warning: "bg-amber-950/40 border-amber-500/20 text-amber-200",
    info: "bg-blue-950/40 border-blue-500/20 text-blue-200",
    emerald: "bg-emerald-950/40 border-emerald-500/20 text-emerald-200",
  };

  return (
    <aside
      aria-label="Notification"
      className={`w-full border-b py-2 px-4 text-center text-xs transition-colors ${typeStyles[type]}`}
    >
      <div className="mx-auto max-w-7xl flex items-center justify-center gap-1.5 flex-wrap">
        <span>{message}</span>
        {linkText && href && (
          <Link
            href={href}
            className="font-medium text-rose-300 hover:text-white underline underline-offset-4 decoration-[#800E13] hover:decoration-rose-300 transition-colors inline-flex items-center gap-0.5 ml-1"
          >
            <span>{linkText}</span>
            <ArrowRight className="h-3 w-3 inline" />
          </Link>
        )}
      </div>
    </aside>
  );
}
