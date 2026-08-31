"use client";

import React, { useEffect, useState, useRef } from "react";

// List of major country IDs in world.svg to trigger random live events
const COUNTRY_IDS = [
  "US", "GB", "DE", "FR", "AE", "JP", "IN", "BR", "CA", "AU",
  "SG", "NL", "SE", "CH", "ES", "IT", "KR", "MX", "ID", "ZA",
  "SA", "TR", "PL", "NO", "DK", "FI", "IE", "NZ", "AR", "EG"
];

export function WorldMapBackground() {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch world.svg on mount
  useEffect(() => {
    fetch("/world.svg")
      .then((res) => res.text())
      .then((text) => {
        // Strip XML declaration to embed cleanly
        const cleanSvg = text.replace(/<\?xml.*?\?>/i, "").replace(/<!--.*?-->/g, "");
        setSvgContent(cleanSvg);
      })
      .catch(() => { });
  }, []);

  // Animate live country event pulses
  useEffect(() => {
    if (!svgContent || !containerRef.current) return;

    const interval = setInterval(() => {
      if (!containerRef.current) return;

      // Pick 2-3 random countries to light up
      const count = Math.floor(Math.random() * 2) + 1;
      const selectedIds: string[] = [];
      for (let i = 0; i < count; i++) {
        const randomId = COUNTRY_IDS[Math.floor(Math.random() * COUNTRY_IDS.length)];
        if (!selectedIds.includes(randomId)) selectedIds.push(randomId);
      }

      selectedIds.forEach((id) => {
        const el = containerRef.current?.querySelector(`path#${id}`) as SVGPathElement | null;
        if (el) {
          // Highlight country in crimson
          el.style.transition = "fill 0.4s ease, stroke 0.4s ease, filter 0.4s ease";
          el.style.fill = "rgba(128, 14, 19, 0.65)";
          el.style.stroke = "rgba(225, 29, 72, 0.9)";
          el.style.filter = "drop-shadow(0 0 8px rgba(128, 14, 19, 0.8))";

          // Fade back to normal
          setTimeout(() => {
            if (el) {
              el.style.fill = "rgba(255, 255, 255, 0.03)";
              el.style.stroke = "rgba(255, 255, 255, 0.1)";
              el.style.filter = "none";
            }
          }, 1800);
        }
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [svgContent]);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden select-none">

      {/* Radial Mask for Soft Legibility Focus */}
      <div
        className="w-full h-full flex items-center justify-center"
        style={{
          maskImage: "radial-gradient(ellipse at center, black 35%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 35%, transparent 85%)",
        }}
      >
        {svgContent ? (
          <div
            ref={containerRef}
            className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:object-contain [&_path]:fill-white/[0.03] [&_path]:stroke-white/[0.1] [&_path]:stroke-[0.5] transition-opacity duration-700 opacity-60"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <div className="w-full h-full" />
        )}
      </div>

    </div>
  );
}
