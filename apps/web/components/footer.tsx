"use client";

import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#1a1a1a] pt-16 pb-12 text-zinc-400 text-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Main Grid: Left Brand Column + Right 3 Clean Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-14 border-b border-white/[0.06]">

          {/* Left Column (Brand & Tagline) - Spans 5 cols */}
          <div className="lg:col-span-5 space-y-4">

            {/* Logo & Name */}
            <div className="flex items-center gap-3">
              <Image
                src="/logo.svg"
                alt="Analytika Logo"
                width={50}
                height={50}
                className="w-12 h-12 object-contain"
              />
              <span className="text-xl font-bold tracking-tight text-white">
                Analytika
              </span>
            </div>

            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-sm">
              High-performance, cookieless web analytics. Track revenue, identify profitable channels, and query stats with MCP AI.
            </p>

            {/* Founder Profile Card */}
            <a
              href="https://x.com/heryad_"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-xl bg-[#222222] border border-white/[0.08] p-2.5 pr-4 hover:border-white/20 transition-all group"
            >
              {/* Profile Image with Unavatar X integration */}
              <img
                src="https://unavatar.io/x/heryad_"
                alt="Heryad"
                className="h-10 w-10 rounded-lg object-cover bg-[#2d2d2d] border border-white/[0.06] shrink-0"
                onError={(e) => {
                  // Fallback avatar if rate-limited
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="leading-tight text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white group-hover:text-rose-200 transition-colors">
                    Heryad
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 bg-[#1A1A1A] px-1.5 py-0.2 rounded border border-white/[0.04]">
                    Founder
                  </span>
                </div>
                <span className="text-[11px] font-mono text-rose-400 group-hover:text-rose-300 transition-colors">
                  @heryad_ on 𝕏
                </span>
              </div>
            </a>

          </div>

          {/* Right Columns (3 Clean Navigation Categories) - Spans 7 cols */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">

            {/* 1. Product */}
            <div className="space-y-3.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-white font-mono">
                Product
              </p>
              <ul className="space-y-2.5 text-xs text-zinc-400">
                <li>
                  <Link href="#features" className="hover:text-white transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#mcp" className="hover:text-white transition-colors">
                    MCP AI Server
                  </Link>
                </li>
                <li>
                  <Link href="#how-it-works" className="hover:text-white transition-colors">
                    Installation
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#faq" className="hover:text-white transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* 2. Developers */}
            <div className="space-y-3.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-white font-mono">
                Developers
              </p>
              <ul className="space-y-2.5 text-xs text-zinc-400">
                <li>
                  <a href="https://docs.analytika.me" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <Link href="#how-it-works" className="hover:text-white transition-colors">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="#mcp" className="hover:text-white transition-colors">
                    Model Context Protocol
                  </Link>
                </li>
                <li>
                  <Link href="#features" className="hover:text-white transition-colors">
                    Cookieless Tracking
                  </Link>
                </li>
              </ul>
            </div>

            {/* 3. Legal */}
            <div className="space-y-3.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-white font-mono">
                Legal
              </p>
              <ul className="space-y-2.5 text-xs text-zinc-400">
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} Analytika Inc. All rights reserved.</p>

          <p className="text-zinc-400 font-medium flex items-center gap-1.5">
            Built with <span className="text-rose-500">❤️</span> in <span className="text-base leading-none">🇦🇪</span> UAE
          </p>
        </div>

      </div>
    </footer>
  );
}
