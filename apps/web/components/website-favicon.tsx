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
  clean = clean.replace(/^(https?:\/\/)?(www\.)?/, "");
  clean = clean.split("/")[0].split("?")[0].split("#")[0];
  return clean;
}

export function WebsiteFavicon({
  domain,
  className = "w-6 h-6 object-contain rounded-md",
  size = 64,
  alt,
  fallbackIcon,
  hideOnFail = false,
  onLoadedChange,
}: WebsiteFaviconProps) {
  const clean = cleanDomainName(domain);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [hasFailedAll, setHasFailedAll] = useState(false);

  // Candidate sources with fallback sequence:
  // 1. Google S2 Favicons
  // 2. Direct domain favicon.ico
  // 3. Direct domain logo.png
  // 4. Direct domain apple-touch-icon.png
  const sources = clean
    ? [
        `https://www.google.com/s2/favicons?domain=${clean}&sz=${size >= 64 ? 128 : 64}`,
        `https://${clean}/favicon.ico`,
        `https://${clean}/logo.png`,
        `https://${clean}/apple-touch-icon.png`,
      ]
    : [];

  useEffect(() => {
    setSourceIndex(0);
    setHasFailedAll(false);
    if (!clean && onLoadedChange) onLoadedChange(false);
  }, [clean]);

  if (!clean || hasFailedAll) {
    if (hideOnFail) return null;
    return (
      fallbackIcon || (
        <div
          className={`flex items-center justify-center bg-white/5 border border-white/10 text-zinc-300 font-bold uppercase text-[10px] select-none ${className}`}
        >
          {clean ? clean[0] : <Globe className="w-3.5 h-3.5 text-zinc-400" />}
        </div>
      )
    );
  }

  const currentSrc = sources[sourceIndex];

  return (
    <img
      key={`${clean}-${sourceIndex}`}
      src={currentSrc}
      alt={alt || `${clean} icon`}
      className={className}
      loading="lazy"
      onLoad={() => {
        if (onLoadedChange) onLoadedChange(true);
      }}
      onError={() => {
        if (sourceIndex < sources.length - 1) {
          setSourceIndex((prev) => prev + 1);
        } else {
          setHasFailedAll(true);
          if (onLoadedChange) onLoadedChange(false);
        }
      }}
    />
  );
}
