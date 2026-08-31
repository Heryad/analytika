"use client";

import React, { useState, useEffect } from "react";
import { Users, ArrowRight, TrendingDown } from "lucide-react";

interface FunnelStep {
  name: string;
  users: number;
  percentage: number;
}

interface Funnel {
  id: string;
  name: string;
  steps: FunnelStep[];
}

interface FunnelVisualizerProps {
  funnels: Funnel[];
}

import { AddFunnelModal } from "./add-funnel-modal";
import { Plus, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function FunnelVisualizer({ funnels }: FunnelVisualizerProps) {
  const [activeFunnelId, setActiveFunnelId] = useState(funnels[0]?.id);
  const activeFunnel = funnels.find((f) => f.id === activeFunnelId) || funnels[0];
  
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [hoveredStepIndex, setHoveredStepIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(false);
    const t = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(t);
  }, [activeFunnelId]);

  if (!activeFunnel) return null;

  // Rich breakdown generator for step hover details
  const getStepDetails = (stepIndex: number) => {
    const step = activeFunnel.steps[stepIndex];
    if (!step) return null;

    const values = ["$0.00", "$14.20", "$48.50", "$89.00", "$149.00"];
    const stepValue = values[Math.min(stepIndex, values.length - 1)] + "/visitor";

    const sourcesMap = [
      [
        { name: "Direct / None", pct: "48%" },
        { name: "Google", pct: "32%" },
        { name: "Twitter / X", pct: "20%" },
      ],
      [
        { name: "Direct / None", pct: "52%" },
        { name: "Google", pct: "30%" },
        { name: "ProductHunt", pct: "18%" },
      ],
      [
        { name: "Google", pct: "45%" },
        { name: "Direct / None", pct: "40%" },
        { name: "Referral", pct: "15%" },
      ],
      [
        { name: "Google", pct: "54%" },
        { name: "Direct / None", pct: "34%" },
        { name: "Email", pct: "12%" },
      ],
    ];

    const countriesMap = [
      [
        { code: "us", name: "United States", pct: "42%" },
        { code: "de", name: "Germany", pct: "22%" },
        { code: "gb", name: "United Kingdom", pct: "18%" },
      ],
      [
        { code: "ae", name: "United Arab Emirates", pct: "35%" },
        { code: "us", name: "United States", pct: "35%" },
        { code: "cn", name: "China", pct: "30%" },
      ],
      [
        { code: "us", name: "United States", pct: "50%" },
        { code: "gb", name: "United Kingdom", pct: "22%" },
        { code: "ca", name: "Canada", pct: "14%" },
      ],
      [
        { code: "us", name: "United States", pct: "58%" },
        { code: "de", name: "Germany", pct: "20%" },
        { code: "ae", name: "United Arab Emirates", pct: "14%" },
      ],
    ];

    return {
      step,
      stepValue,
      sources: sourcesMap[stepIndex % sourcesMap.length],
      countries: countriesMap[stepIndex % countriesMap.length],
    };
  };

  const hoveredDetails = hoveredStepIndex !== null ? getStepDetails(hoveredStepIndex) : null;

  return (
    <div className="w-full h-full flex pt-1 pb-1 gap-3 relative">
      {/* Left Sidebar */}
      <div 
        className={`group transition-all duration-300 ease-out flex flex-col border border-white/[0.08] rounded-xl bg-[#1F1F1F] shadow-inner relative shrink-0 overflow-hidden ${
          openMenuId ? 'w-[250px]' : 'w-[175px] hover:w-[250px]'
        }`}
      >
        
        {/* Funnel List */}
        <div className="flex-1 flex flex-col p-2 gap-1 overflow-y-auto custom-scrollbar">
          {funnels.map((funnel) => {
            const isActive = activeFunnelId === funnel.id;
            return (
              <div 
                key={funnel.id}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors group/item cursor-pointer ${
                  isActive 
                    ? "bg-[#262626] text-white shadow-sm border border-white/[0.04]" 
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"
                }`}
                onClick={() => {
                  if (!isActive) {
                    setMounted(false);
                    setActiveFunnelId(funnel.id);
                  }
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${isActive ? "bg-rose-500 shadow-sm shadow-rose-500/50" : "bg-zinc-600"}`} />
                  <span className="text-[13px] font-medium truncate">
                    {funnel.name}
                  </span>
                </div>
                
                <DropdownMenu
                  modal={false}
                  onOpenChange={(isOpen) => {
                    if (isOpen) setOpenMenuId(funnel.id);
                    else if (openMenuId === funnel.id) setOpenMenuId(null);
                  }}
                >
                  <DropdownMenuTrigger asChild>
                    <button 
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      className={`p-1 rounded transition-all shrink-0 ${openMenuId === funnel.id ? 'opacity-100 bg-white/10 text-white' : 'opacity-0 group-hover/item:opacity-100 hover:bg-white/10 text-zinc-400 hover:text-white'}`}
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36 bg-[#1F1F1F] border-white/[0.08] text-zinc-300">
                    <DropdownMenuItem 
                      onClick={(e) => e.stopPropagation()}
                      className="hover:bg-white/[0.04] hover:text-white cursor-pointer focus:bg-white/[0.04] focus:text-white"
                    >
                      <Edit className="w-3.5 h-3.5 mr-2" />
                      Edit Funnel
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => e.stopPropagation()}
                      className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 cursor-pointer focus:bg-rose-500/10 focus:text-rose-300"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>

        {/* Sticky Add Funnel Footer */}
        <div className="p-2 border-t border-white/[0.08] bg-[#1F1F1F]">
          <AddFunnelModal>
            <button className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors whitespace-nowrap overflow-hidden">
              <Plus className="w-4 h-4 shrink-0" />
              <span className="text-[13px] font-medium">
                Add Funnel
              </span>
            </button>
          </AddFunnelModal>
        </div>
      </div>

      {/* Main Visualizer Area */}
      <div 
        className="flex-1 flex flex-col justify-between p-4 bg-[#181818]/60 border border-white/[0.04] rounded-xl overflow-hidden min-w-0 relative"
      >
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes funnelStreamReveal {
            from { clip-path: inset(0 100% 0 0); }
            to { clip-path: inset(0 0% 0 0); }
          }
          @keyframes stepBadgePop {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.4); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }
          @keyframes stepCardSlide {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes dividerFade {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        ` }} />

        {/* Top Header Summary (Static, No Animation) */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">{activeFunnel.name}</span>
            <span className="text-xs text-zinc-500">({activeFunnel.steps.length} steps)</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-white font-mono">
              {((activeFunnel.steps[activeFunnel.steps.length - 1].users / activeFunnel.steps[0].users) * 100).toFixed(1)}%
              <span className="text-zinc-400 text-xs font-normal ml-1 font-sans">conversion rate</span>
            </div>
            <div className="text-[11px] text-zinc-500">
              {activeFunnel.steps[0].users.toLocaleString()} total visitors
            </div>
          </div>
        </div>

        {/* Horizontal Funnel Stream Canvas */}
        <div key={`stream-${activeFunnel.id}`} className="relative w-full h-[185px] flex items-center justify-center my-1">
          {(() => {
            const steps = activeFunnel.steps;
            const N = steps.length;
            const W = 1000;
            const H = 200;
            const centerY = 100;
            const maxHalf = 78;
            const minHalf = 16;

            const firstUsers = steps[0].users || 1;
            const heights = steps.map((s) => {
              const ratio = Math.min(Math.max(s.users / firstUsers, 0), 1);
              return Math.max(ratio * maxHalf, minHalf);
            });

            // Build Top Path and Bottom Path
            let topPath = `M 0 ${centerY - heights[0]}`;
            for (let i = 0; i < N - 1; i++) {
              const x1 = i * (W / N);
              const x2 = (i + 1) * (W / N);
              const dx = x2 - x1;
              const y1 = centerY - heights[i];
              const y2 = centerY - heights[i + 1];
              topPath += ` C ${x1 + dx * 0.5} ${y1}, ${x2 - dx * 0.5} ${y2}, ${x2} ${y2}`;
            }
            // flat segment for the last step to edge
            topPath += ` L ${W} ${centerY - heights[N - 1]}`;

            let fullFunnelPath = topPath;
            // right edge
            fullFunnelPath += ` L ${W} ${centerY + heights[N - 1]}`;

            // bottom path backwards
            for (let i = N - 2; i >= 0; i--) {
              const x1 = (i + 1) * (W / N);
              const x2 = i * (W / N);
              const dx = x1 - x2;
              const y1 = centerY + heights[i + 1];
              const y2 = centerY + heights[i];
              fullFunnelPath += ` C ${x1 - dx * 0.5} ${y1}, ${x2 + dx * 0.5} ${y2}, ${x2} ${y2}`;
            }
            fullFunnelPath += ` Z`;

            // Separate bottom path for stroke line
            let bottomPath = `M 0 ${centerY + heights[0]}`;
            for (let i = 0; i < N - 1; i++) {
              const x1 = i * (W / N);
              const x2 = (i + 1) * (W / N);
              const dx = x2 - x1;
              const y1 = centerY + heights[i];
              const y2 = centerY + heights[i + 1];
              bottomPath += ` C ${x1 + dx * 0.5} ${y1}, ${x2 - dx * 0.5} ${y2}, ${x2} ${y2}`;
            }
            bottomPath += ` L ${W} ${centerY + heights[N - 1]}`;

            return (
              <div className="relative w-full h-full flex items-center">
                <svg
                  viewBox={`0 0 ${W} ${H}`}
                  preserveAspectRatio="none"
                  className="w-full h-full"
                  style={{
                    animation: "funnelStreamReveal 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                  }}
                >
                  <defs>
                    {/* Soft, calming slate-cyan-blue gradient */}
                    <linearGradient id="funnelFillGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#355C7D" stopOpacity="0.65" />
                      <stop offset="60%" stopColor="#2A475E" stopOpacity="0.55" />
                      <stop offset="100%" stopColor="#1E3243" stopOpacity="0.5" />
                    </linearGradient>

                    <linearGradient id="funnelStrokeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#5D8AA8" stopOpacity="0.9" />
                      <stop offset="60%" stopColor="#4A708B" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#3B596F" stopOpacity="0.7" />
                    </linearGradient>
                  </defs>

                  {/* Funnel Stream Shape */}
                  <path
                    d={fullFunnelPath}
                    fill="url(#funnelFillGrad)"
                  />

                  {/* Top Glowing Stroke */}
                  <path
                    d={topPath}
                    fill="none"
                    stroke="url(#funnelStrokeGrad)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  {/* Bottom Glowing Stroke */}
                  <path
                    d={bottomPath}
                    fill="none"
                    stroke="url(#funnelStrokeGrad)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  {/* Step Vertical Divider Lines */}
                  {steps.slice(1).map((_, i) => {
                    const x = (i + 1) * (W / N);
                    return (
                      <line
                        key={i}
                        x1={x}
                        y1={8}
                        x2={x}
                        y2={H - 8}
                        stroke="rgba(255, 255, 255, 0.08)"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                        style={{
                          opacity: 0,
                          animation: `dividerFade 0.35s ease-out ${(i + 1) * 150}ms forwards`,
                        }}
                      />
                    );
                  })}
                </svg>

                {/* Interactive Step Hover Regions over SVG */}
                <div className="absolute inset-0 flex z-10">
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-full cursor-pointer transition-colors duration-150 ${
                        hoveredStepIndex === i ? "bg-white/[0.04] border-x border-white/[0.08]" : ""
                      }`}
                      onMouseEnter={(e) => {
                        setHoveredStepIndex(i);
                        setMousePos({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseMove={(e) => {
                        setMousePos({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseLeave={() => setHoveredStepIndex(null)}
                    />
                  ))}
                </div>

                {/* Drop-off Percentage Badges Centered on Dividers with Staggered Pop-in */}
                {steps.slice(1).map((step, i) => {
                  const prevUsers = steps[i].users;
                  const dropoff = Math.round((1 - step.users / prevUsers) * 100);
                  const leftPercent = ((i + 1) / N) * 100;

                  return (
                    <div
                      key={step.name}
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 pointer-events-none"
                      style={{ 
                        left: `${leftPercent}%`,
                        opacity: 0,
                        animation: `stepBadgePop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) ${(i + 1) * 150 + 50}ms forwards`,
                      }}
                    >
                      <div className="flex items-center gap-1 px-2.5 py-1 bg-[#141414]/90 border border-white/10 rounded-full shadow-lg backdrop-blur-md text-[11px] font-mono font-medium text-zinc-300">
                        <span className="text-rose-400">-{dropoff}%</span>
                        <span className="text-zinc-500 text-[10px]">→</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Bottom Step Labels with Staggered Cascading Slide-up */}
        <div 
          key={`cards-${activeFunnel.id}`}
          className="grid pt-2.5 border-t border-white/[0.06] gap-2.5 z-10 shrink-0" 
          style={{ gridTemplateColumns: `repeat(${activeFunnel.steps.length}, minmax(0, 1fr))` }}
        >
          {activeFunnel.steps.map((step, index) => (
            <div 
              key={step.name} 
              className={`flex flex-col min-w-0 px-2 py-1.5 rounded-lg cursor-pointer transition-all ${
                hoveredStepIndex === index ? "bg-white/[0.06]" : "hover:bg-white/[0.02]"
              }`}
              style={{
                opacity: 0,
                animation: `stepCardSlide 0.45s cubic-bezier(0.16, 1, 0.3, 1) ${index * 110 + 60}ms forwards`,
              }}
              onMouseEnter={(e) => {
                setHoveredStepIndex(index);
                setMousePos({ x: e.clientX, y: e.clientY });
              }}
              onMouseMove={(e) => {
                setMousePos({ x: e.clientX, y: e.clientY });
              }}
              onMouseLeave={() => setHoveredStepIndex(null)}
            >
              <div className="text-[13px] font-semibold text-white tracking-tight flex items-baseline gap-1.5">
                <span>{step.users.toLocaleString()}</span>
                <span className="text-zinc-500 text-[11px] font-normal font-sans">visitors</span>
              </div>
              
              <div className="text-[12px] text-zinc-400 font-medium truncate mt-0.5" title={step.name}>
                {step.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Detailed Step Tooltip */}
      {hoveredDetails && (
        <div
          className="fixed z-[100] pointer-events-none bg-[#1C1C1E]/95 backdrop-blur-xl border border-white/[0.12] p-3.5 rounded-xl shadow-2xl w-[300px] transform -translate-x-1/2 -translate-y-full transition-transform duration-75 text-white"
          style={{
            left: `${mousePos.x}px`,
            top: `${mousePos.y - 14}px`,
          }}
        >
          {/* Tooltip Header */}
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/[0.08]">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2 h-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50 shrink-0" />
              <span className="text-xs font-semibold text-white truncate">
                {hoveredDetails.step.name}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-white shrink-0">
              {hoveredDetails.step.users.toLocaleString()}
            </span>
          </div>

          {/* Step Value Row */}
          <div className="flex items-center justify-between py-2 border-b border-white/[0.08]">
            <span className="text-[11px] font-medium text-zinc-400">Step value</span>
            <span className="text-xs font-mono font-semibold text-white">{hoveredDetails.stepValue}</span>
          </div>

          {/* Top Sources & Top Countries 2-Column Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2.5">
            {/* Top Sources */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Top Sources</span>
              <div className="flex flex-col gap-1">
                {hoveredDetails.sources.map((src, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-300 truncate max-w-[85px]" title={src.name}>{src.name}</span>
                    <span className="text-zinc-400 font-mono text-[10px] shrink-0">{src.pct}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Countries */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Top Countries</span>
              <div className="flex flex-col gap-1">
                {hoveredDetails.countries.map((ctry, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <img 
                        src={`https://flagcdn.com/w20/${ctry.code}.png`} 
                        alt={ctry.name} 
                        className="w-3.5 h-2.5 rounded-sm object-cover shrink-0" 
                      />
                      <span className="text-zinc-300 truncate max-w-[70px]" title={ctry.name}>{ctry.name}</span>
                    </div>
                    <span className="text-zinc-400 font-mono text-[10px] shrink-0">{ctry.pct}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
