"use client";

import React, { useState, useEffect } from "react";
import { Globe } from "lucide-react";

interface WebsiteFaviconProps {
  domain: string;
  className?: string;
  size?: number;
  alt?: string;
  fallbackIcon?: React.ReactNode;
  hideOnFail?: boolean;
  onLoadedChange?: (loaded: boolean) => void;
}

export function cleanDomainName(raw: string): string {
  if (!raw) return "";
  let clean = raw.trim().toLowerCase();
  // Strip protocol and www
  clean = clean.replace(/^(https?:\/\/)?(www\.)?/, "");
  // Strip paths, query params, hashes
  clean = clean.split("/")[0].split("?")[0].split("#")[0];
  
  // If the string doesn't contain a TLD (no dot), assume .com
  if (clean && !clean.includes(".")) {
    clean += ".com";
  }
  
  return clean;
}

export function WebsiteFavicon({
  domain,
  className = "w-6 h-6 object-contain rounded-md",
  size = 64, // Not used strictly with DuckDuckGo, but kept for signature compatibility
  alt,
  fallbackIcon,
  hideOnFail = false,
  onLoadedChange,
}: WebsiteFaviconProps) {
  const clean = cleanDomainName(domain);

  useEffect(() => {
    if (!clean && onLoadedChange) onLoadedChange(false);
  }, [clean]);

  if (!clean) {
    if (hideOnFail) return null;
    return (
      fallbackIcon || (
        <div
          className={`flex items-center justify-center bg-white/5 border border-white/10 text-zinc-300 font-bold uppercase text-[10px] select-none ${className}`}
        >
          <Globe className="w-3.5 h-3.5 text-zinc-400" />
        </div>
      )
    );
  }

  // DuckDuckGo Favicon Service: 
  // Fast, handles redirects, and guarantees a 200 OK with a generic icon if missing.
  const currentSrc = `https://icons.duckduckgo.com/ip3/${clean}.ico`;

  return (
    <img
      src={currentSrc}
      alt={alt || `${clean} icon`}
      className={className}
      loading="lazy"
      onLoad={() => {
        if (onLoadedChange) onLoadedChange(true);
      }}
      onError={(e) => {
        // Since DuckDuckGo always returns a 200 OK fallback, an error here 
        // implies a critical network block (e.g. adblocker on DuckDuckGo).
        e.currentTarget.style.display = "none";
        if (onLoadedChange) onLoadedChange(false);
      }}
    />
  );
}
