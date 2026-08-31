"use client";

import React, { useEffect, useState, useRef } from "react";

interface CountryData {
  name: string;
  code: string;
  flag: string;
  count: number;
  percentage: number;
}

interface InteractiveMapProps {
  data: CountryData[];
}

export function InteractiveMap({ data }: InteractiveMapProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredCountry, setHoveredCountry] = useState<CountryData | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Pre-calculate data map for O(1) lookups
  const dataMap = useRef<Map<string, CountryData>>(new Map());
  useEffect(() => {
    const map = new Map<string, CountryData>();
    data.forEach(d => map.set(d.code, d));
    dataMap.current = map;
  }, [data]);

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
          return `<svg viewBox="0 0 1009.6727 665.96301" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" ${cleanedAttrs}>`;
        });

        setSvgContent(cleanSvg);
      })
      .catch(() => {});
  }, []);

  // Attach event listeners to SVG paths after rendering
  useEffect(() => {
    if (!svgContent || !containerRef.current) return;

    const svgElement = containerRef.current.querySelector("svg");
    if (!svgElement) return;

    const paths = svgElement.querySelectorAll("path");
    paths.forEach((path) => {
      const rawId = path.getAttribute("id") || path.id;
      if (!rawId) return;
      const id = rawId.toUpperCase();

      const countryData = dataMap.current.get(id);

      // Color active countries
      if (countryData) {
        path.style.fill = "#800E13";
        path.style.fillOpacity = (0.2 + (countryData.percentage / 100) * 0.8).toString(); // Opacity based on percentage
        path.style.cursor = "pointer";
        path.style.transition = "fill 0.2s, fill-opacity 0.2s, stroke 0.2s";
        
        path.addEventListener("mouseenter", (e) => {
          path.style.stroke = "#E11D48";
          path.style.strokeWidth = "1.5";
          path.style.fillOpacity = "1";
          setHoveredCountry(countryData);
        });

        path.addEventListener("mousemove", (e: Event) => {
          const mouseEvent = e as MouseEvent;
          setMousePos({ x: mouseEvent.clientX, y: mouseEvent.clientY });
        });

        path.addEventListener("mouseleave", () => {
          path.style.stroke = "rgba(255,255,255,0.05)";
          path.style.strokeWidth = "0.5";
          path.style.fillOpacity = (0.2 + (countryData.percentage / 100) * 0.8).toString();
          setHoveredCountry(null);
        });
      } else {
        path.style.fill = "#262626"; // Match card background instead of being transparent
        path.style.stroke = "rgba(255,255,255,0.08)";
        path.style.strokeWidth = "0.5";
      }
    });

  }, [svgContent, data]);

  return (
    <div className="relative w-full h-full min-h-[300px] flex items-center justify-center">
      {svgContent ? (
        <div
          ref={containerRef}
          className="w-full h-full max-h-[320px] flex items-center justify-center"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      ) : (
        <div className="flex items-center justify-center text-zinc-500 font-mono text-xs animate-pulse">Loading map...</div>
      )}

      {/* Tooltip Portal */}
      {hoveredCountry && (
        <div 
          className="fixed z-[100] pointer-events-none bg-[#1F1F1F] border border-white/[0.08] p-2.5 rounded-lg shadow-xl flex items-center gap-3 transform -translate-x-1/2 -translate-y-full"
          style={{
            left: `${mousePos.x}px`,
            top: `${mousePos.y - 15}px`,
          }}
        >
          <span className="text-2xl leading-none">{hoveredCountry.flag}</span>
          <div>
            <div className="text-zinc-200 font-medium text-xs truncate max-w-[150px]">{hoveredCountry.name}</div>
            <div className="text-white font-mono font-bold text-sm">{hoveredCountry.count.toLocaleString()} <span className="text-zinc-500 text-[10px] ml-1 font-sans font-normal">visitors</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
