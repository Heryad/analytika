"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#1F1F1F]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Brand Logo - Simple & clean without wrapper */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="Analytika Logo"
            width={50}
            height={50}
            className="w-12 h-12 object-contain"
            priority
          />
          <span className="text-xl font-bold tracking-tight text-white">
            Analytika
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-300">
          <Link href="#features" className="transition-colors hover:text-white">
            Features
          </Link>
          <Link href="#mcp" className="transition-colors hover:text-white">
            MCP AI
          </Link>
          <Link href="#how-it-works" className="transition-colors hover:text-white">
            How It Works
          </Link>
          <Link href="#reviews" className="transition-colors hover:text-white">
            Reviews
          </Link>
          <Link href="#pricing" className="transition-colors hover:text-white">
            Pricing
          </Link>
          <Link href="#faq" className="transition-colors hover:text-white">
            FAQ
          </Link>
        </nav>

        {/* Single Action Button */}
        <div className="flex items-center">
          <Button
            className="bg-[#800E13] hover:bg-[#9e1218] text-white font-semibold text-sm px-5 h-10 shadow-sm border border-[#800E13] transition-all"
            asChild
          >
            <Link href="/auth/login">
              Start Free
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>

      </div>
    </header>
  );
}
