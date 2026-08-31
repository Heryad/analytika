"use client";

import React, { useEffect, useState, useRef } from "react";

// List of major country IDs across all continents
const COUNTRY_IDS = [
  "US", "GB", "DE", "FR", "AE", "JP", "IN", "BR", "CA", "AU",
  "SG", "NL", "SE", "CH", "ES", "IT", "KR", "MX", "ID", "ZA",
  "SA", "TR", "PL", "NO", "DK", "FI", "IE", "NZ", "AR", "EG",
  "CL", "CO", "NG", "KE", "TH", "MY", "PH", "VN", "PT", "BE"
];

export function WorldMapBackground() {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch world.svg on mount
  useEffect(() => {
    fetch("/world.svg")
      .then((res) => res.text())
      .then((text) => {
        let cleanSvg = text
          .replace(/<\?xml.*?\?>/i, "")
          .replace(/<!--.*?-->/g, "");

        cleanSvg = cleanSvg.replace(/<svg\b([^>]*)>/i, (match, attrs) => {
          const cleanedAttrs = attrs.replace(/\b(width|height|viewBox|preserveAspectRatio)="[^"]*"/g, "");
          return `<svg viewBox="0 0 1009.6727 665.96301" width="100%" height="100%" preserveAspectRatio="none" ${cleanedAttrs}>`;
        });

        setSvgContent(cleanSvg);
      })
      .catch(() => {});
  }, []);

  // Animate live glowing country pulses
  useEffect(() => {
    if (!svgContent || !containerRef.current) return;

    const interval = setInterval(() => {
      if (!containerRef.current) return;

      // Select 2 to 4 distinct random countries
      const count = Math.floor(Math.random() * 3) + 2;
      const shuffled = [...COUNTRY_IDS].sort(() => 0.5 - Math.random());
      const selectedIds = shuffled.slice(0, count);

      selectedIds.forEach((id) => {
        const elements = containerRef.current?.querySelectorAll(`path#${id}, path[id="${id}"]`);
        if (elements && elements.length > 0) {
          elements.forEach((el) => {
            el.classList.remove("country-pulse");
            // Force DOM reflow so animation restarts cleanly
            void el.getBoundingClientRect();
            el.classList.add("country-pulse");
          });
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [svgContent]);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden select-none">
      
      {/* Radial Mask for Soft Legibility Focus */}
      <div
        className="w-full h-full flex items-center justify-center relative"
        style={{
          maskImage: "radial-gradient(ellipse at center, black 35%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 35%, transparent 85%)",
        }}
      >
        {svgContent ? (
          <div
            ref={containerRef}
            className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&_path]:fill-white/[0.03] [&_path]:stroke-white/[0.09] [&_path]:stroke-[0.5] transition-opacity duration-700 opacity-60"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <div className="w-full h-full" />
        )}
      </div>

    </div>
  );
}
