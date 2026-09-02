"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Users, ArrowRight, TrendingDown, Plus, MoreHorizontal, Edit, Trash2, Loader2 } from "lucide-react";
import { AddFunnelModal } from "./add-funnel-modal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { funnelsApi } from "@/lib/api";

interface FunnelStep {
  name: string;
  users: number;
  percentage: number;
  stepValue?: string;
  sources?: { name: string; pct: string }[];
  countries?: { name: string; code: string; pct: string }[];
}

interface Funnel {
  id: string;
  name: string;
  steps: FunnelStep[];
}

interface FunnelVisualizerProps {
  funnels?: Funnel[];
  websiteId?: string;
  timeRange?: string;
  readOnly?: boolean;
}

export function FunnelVisualizer({
  funnels = [],
  websiteId,
  timeRange = "30d",
  readOnly = false,
}: FunnelVisualizerProps) {
  const [funnelList, setFunnelList] = useState<Funnel[]>(funnels);
  const [activeFunnelId, setActiveFunnelId] = useState(funnels[0]?.id);
  const [deleteTarget, setDeleteTarget] = useState<Funnel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(Boolean(websiteId));
  const activeFunnel = funnelList.find((f) => f.id === activeFunnelId) || funnelList[0];

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [hoveredStepIndex, setHoveredStepIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(false);
    const t = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(t);
  }, [activeFunnelId]);

  const loadFunnels = useCallback(async () => {
    if (!websiteId) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await funnelsApi.list(websiteId, timeRange);
      if (res.success && res.funnels) {
        setFunnelList(res.funnels as Funnel[]);
        if (res.funnels.length > 0) {
          if (!activeFunnelId || !res.funnels.some((f) => f.id === activeFunnelId)) {
            setActiveFunnelId(res.funnels[0].id);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load funnels:", err);
    } finally {
      setIsLoading(false);
    }
  }, [websiteId, timeRange, activeFunnelId]);

  useEffect(() => {
    if (websiteId) {
      loadFunnels();
    }
  }, [websiteId, loadFunnels]);

  const handleAddNewFunnel = async ({ name, steps }: { name: string; steps: any[] }) => {
    if (websiteId) {
      try {
        const res = await funnelsApi.create(websiteId, { name, steps });
        if (res.success && res.funnel) {
          await loadFunnels();
          setActiveFunnelId(res.funnel.id);
          return;
        }
      } catch (err) {
        console.error("Failed to create funnel:", err);
      }
    }

    const newFunnelId = `f-${Date.now()}`;
    const baseVisitors = 18450;
    const computedSteps = steps.map((s, idx) => {
      const dropMultiplier = Math.pow(0.72, idx);
      const userCount = Math.round(baseVisitors * dropMultiplier);
      const pct = Math.round((userCount / baseVisitors) * 100);
      return {
        name: s.name,
        users: userCount,
        percentage: pct,
      };
    });

    const newFunnel: Funnel = {
      id: newFunnelId,
      name,
      steps: computedSteps,
    };

    setFunnelList((prev) => [...prev, newFunnel]);
    setActiveFunnelId(newFunnelId);
  };

  const confirmDeleteFunnel = async () => {
    if (!websiteId || !deleteTarget) return;
    setIsDeleting(true);
    try {
      await funnelsApi.delete(websiteId, deleteTarget.id);
      const filtered = funnelList.filter((f) => f.id !== deleteTarget.id);
      setFunnelList(filtered);
      if (activeFunnelId === deleteTarget.id) {
        setActiveFunnelId(filtered[0]?.id);
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete funnel:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading && funnelList.length === 0) {
    return (
      <div className="w-full h-full flex flex-col md:flex-row gap-3 min-h-[360px] animate-pulse select-none">
        <div className="hidden md:flex w-[175px] rounded-xl border border-white/[0.08] bg-[#1F1F1F] p-2 flex-col gap-2 shrink-0">
          <div className="h-8 rounded-lg bg-white/[0.05]" />
          <div className="h-8 rounded-lg bg-white/[0.03]" />
          <div className="h-8 rounded-lg bg-white/[0.03]" />
        </div>
        <div className="flex-1 rounded-xl border border-white/[0.04] bg-[#181818]/60 p-4 flex flex-col justify-between">
          <div className="flex justify-between items-center pb-2 border-b border-white/[0.06]">
            <div className="w-36 h-5 rounded bg-white/[0.05]" />
            <div className="w-24 h-4 rounded bg-white/[0.04]" />
          </div>
          <div className="w-full h-[180px] rounded-xl bg-white/[0.03] my-2" />
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/[0.06]">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-white/[0.03]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (funnelList.length === 0 || !activeFunnel) {
    if (readOnly) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/[0.08] rounded-xl p-8 text-center bg-[#1F1F1F]/40 space-y-3 min-h-[220px]">
          <div className="w-10 h-10 rounded-xl bg-[#2A2A2A] border border-white/[0.08] flex items-center justify-center shadow-inner">
            <TrendingDown className="w-5 h-5 text-rose-500" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-sm font-semibold text-white">No Funnels Defined</h3>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/[0.08] rounded-xl p-8 text-center bg-[#1F1F1F]/40 space-y-4 min-h-[360px]">
        <div className="w-12 h-12 rounded-2xl bg-[#2A2A2A] border border-white/[0.08] flex items-center justify-center shadow-inner">
          <TrendingDown className="w-6 h-6 text-rose-500" />
        </div>
        <div className="space-y-1 max-w-md">
          <h3 className="text-base font-semibold text-white">No Conversion Funnels Defined</h3>
          <p className="text-xs text-zinc-400">
            Define multi-step sequential conversion flows (e.g. Landing → Pricing → Sign Up → Checkout) to monitor drop-offs.
          </p>
        </div>
        <AddFunnelModal onAddFunnel={handleAddNewFunnel}>
          <Button
            size="sm"
            className="bg-[#800E13] hover:bg-[#9B1218] text-white font-mono text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Funnel</span>
          </Button>
        </AddFunnelModal>
      </div>
    );
  }

  // Step hover breakdown details
  const getStepDetails = (stepIndex: number) => {
    const step = activeFunnel.steps[stepIndex];
    if (!step) return null;

    const prevUsers = stepIndex > 0 ? (activeFunnel.steps[stepIndex - 1]?.users || 0) : step.users;
    const dropoff = prevUsers > 0 ? Math.max(0, Math.round((1 - (step.users || 0) / prevUsers) * 100)) : 0;
    const stepValue = step.stepValue || "$0.00/visitor";
    const sources = step.sources || [];
    const countries = step.countries || [];

    return {
      step,
      stepIndex,
      dropoff,
      stepValue,
      sources,
      countries,
    };
  };

  const hoveredDetails = hoveredStepIndex !== null ? getStepDetails(hoveredStepIndex) : null;

  return (
    <div className="w-full h-full flex flex-col md:flex-row gap-3 min-h-0">

      {/* Mobile Toolbar (md:hidden) */}
      <div className="flex md:hidden items-center justify-between gap-2.5 pb-1">
        <div className="flex-1 min-w-0">
          <Select
            value={activeFunnelId}
            onValueChange={(val) => {
              setMounted(false);
              setActiveFunnelId(val);
            }}
          >
            <SelectTrigger className="w-full bg-[#1F1F1F] border-white/[0.08] text-white text-xs h-9">
              <div className="flex items-center gap-2 truncate">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                <span className="truncate">{activeFunnel?.name || "Select Funnel"}</span>
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#1F1F1F] border-white/[0.08] text-zinc-200">
              {funnelList.map((funnel) => (
                <SelectItem key={funnel.id} value={funnel.id} className="text-xs cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${funnel.id === activeFunnelId ? "bg-rose-500" : "bg-zinc-500"}`} />
                    <span>{funnel.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!readOnly && (
          <AddFunnelModal onAddFunnel={handleAddNewFunnel}>
            <Button
              size="sm"
              className="bg-[#800E13] hover:bg-[#9e1218] text-white text-xs h-9 px-3 rounded-xl font-medium transition-all shadow-sm shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Funnel</span>
            </Button>
          </AddFunnelModal>
        )}
      </div>

      {/* Desktop Left Sidebar (hidden md:flex) */}
      <div
        className={`hidden md:flex group transition-all duration-300 ease-out flex-col border border-white/[0.08] rounded-xl bg-[#1F1F1F] shadow-inner relative shrink-0 overflow-hidden ${openMenuId ? 'w-[250px]' : 'w-[175px] hover:w-[250px]'
          }`}
      >

        {/* Funnel List */}
        <div className="flex-1 flex flex-col p-2 gap-1 overflow-y-auto custom-scrollbar">
          {funnelList.map((funnel) => {
            const isActive = activeFunnelId === funnel.id;
            return (
              <div
                key={funnel.id}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors group/item cursor-pointer ${isActive
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

                {!readOnly && (
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(funnel);
                        }}
                        className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 cursor-pointer focus:bg-rose-500/10 focus:text-rose-300 flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Delete Funnel
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            );
          })}
        </div>

        {/* Sticky Add Funnel Footer */}
        {!readOnly && (
          <div className="p-2 border-t border-white/[0.08] bg-[#1F1F1F]">
            <AddFunnelModal onAddFunnel={handleAddNewFunnel}>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 w-full justify-start px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors whitespace-nowrap overflow-hidden cursor-pointer h-9 text-[13px] font-medium"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Add Funnel</span>
              </Button>
            </AddFunnelModal>
          </div>
        )}
      </div>

      {/* Main Visualizer Area */}
      <div
        className="flex-1 flex flex-col justify-between p-3 sm:p-4 bg-[#181818]/60 border border-white/[0.04] rounded-xl overflow-hidden min-w-0 relative"
      >
        <style dangerouslySetInnerHTML={{
          __html: `
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">{activeFunnel.name}</span>
            <span className="text-xs text-zinc-500">({activeFunnel.steps.length} steps)</span>
            <button
              onClick={() => setDeleteTarget(activeFunnel)}
              title="Delete Funnel"
              className="p-1 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer ml-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          {(() => {
            const firstStepUsers = activeFunnel.steps[0]?.users || 0;
            const lastStepUsers = activeFunnel.steps[activeFunnel.steps.length - 1]?.users || 0;
            const convRate = firstStepUsers > 0 ? ((lastStepUsers / firstStepUsers) * 100).toFixed(1) : "0.0";
            return (
              <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-start gap-1">
                <div className="text-xs sm:text-sm font-bold text-white font-mono">
                  {convRate}%
                  <span className="text-zinc-400 text-xs font-normal ml-1 font-sans">conversion rate</span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-zinc-500 font-mono">
                  {firstStepUsers.toLocaleString()} total visitors
                </div>
              </div>
            );
          })()}
        </div>

        {/* Horizontal Funnel Stream Canvas */}
        <div key={`stream-${activeFunnel.id}`} className="relative w-full h-[150px] sm:h-[185px] flex items-center justify-center my-1">
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
                      className={`flex-1 h-full cursor-pointer transition-colors duration-150 ${hoveredStepIndex === i ? "bg-white/[0.04] border-x border-white/[0.08]" : ""
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
                  const prevUsers = steps[i].users || 0;
                  const currUsers = step.users || 0;
                  const dropoff = prevUsers > 0 ? Math.max(0, Math.round((1 - currUsers / prevUsers) * 100)) : 0;
                  const leftPercent = ((i + 1) / N) * 100;

                  return (
                    <div
                      key={step.name || i}
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 pointer-events-none"
                      style={{
                        left: `${leftPercent}%`,
                        opacity: 0,
                        animation: `stepBadgePop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) ${(i + 1) * 150 + 50}ms forwards`,
                      }}
                    >
                      <div className="flex items-center gap-1 px-1.5 py-0.5 sm:px-2.5 sm:py-1 bg-[#141414]/90 border border-white/10 rounded-full shadow-lg backdrop-blur-md text-[10px] sm:text-[11px] font-mono font-medium text-zinc-300">
                        <span className="text-rose-400">-{dropoff}%</span>
                        <span className="text-zinc-500 text-[9px] sm:text-[10px]">→</span>
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
          className="grid grid-cols-2 sm:grid-cols-4 md:flex md:items-stretch pt-2.5 border-t border-white/[0.06] gap-2 z-10 shrink-0"
        >
          {activeFunnel.steps.map((step, index) => (
            <div
              key={step.name || index}
              className={`flex-1 flex flex-col min-w-0 p-2 sm:px-2.5 sm:py-1.5 rounded-lg cursor-pointer transition-all bg-[#1F1F1F]/40 border border-white/[0.03] md:bg-transparent md:border-0 ${hoveredStepIndex === index ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"
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
              <div className="text-xs sm:text-[13px] font-semibold text-white tracking-tight flex items-baseline gap-1">
                <span>{step.users.toLocaleString()}</span>
                <span className="text-zinc-500 text-[10px] sm:text-[11px] font-normal font-sans">visitors</span>
              </div>

              <div className="text-[11px] sm:text-[12px] text-zinc-300 sm:text-zinc-400 font-medium truncate mt-0.5" title={step.name}>
                <span className="text-zinc-500 mr-1 text-[10px] font-mono">{index + 1}.</span>
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
            <span className="text-[11px] font-medium text-zinc-400">Step Value</span>
            <span className="text-xs font-mono font-semibold text-white">{hoveredDetails.stepValue}</span>
          </div>

          {/* Retention & Drop-off Stats */}
          <div className="grid grid-cols-2 gap-2 py-2 border-b border-white/[0.08] text-xs font-mono">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase block">Retention</span>
              <span className="text-emerald-400 font-bold">{hoveredDetails.step.percentage || 0}%</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-500 uppercase block">Drop-off</span>
              <span className="text-rose-400 font-bold">-{hoveredDetails.dropoff}%</span>
            </div>
          </div>

          {/* Top Sources & Top Countries (if available) */}
          {hoveredDetails.sources.length > 0 || hoveredDetails.countries.length > 0 ? (
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
          ) : (
            <div className="pt-2 text-[11px] font-mono text-zinc-500 text-center">
              Step {hoveredDetails.stepIndex + 1} of {activeFunnel.steps.length}
            </div>
          )}
        </div>
      )}

      {/* Sweet Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1E1E1E] border border-white/[0.1] rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Delete Funnel?</h3>
                <p className="text-xs text-zinc-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 bg-[#141414] p-3 rounded-lg border border-white/[0.06] font-mono leading-relaxed">
              Are you sure you want to remove <strong className="text-white font-semibold">"{deleteTarget.name}"</strong>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDeleteTarget(null)}
                className="text-xs font-mono text-zinc-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteFunnel}
                className="bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs cursor-pointer flex items-center gap-1.5"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? "Deleting..." : "Delete Funnel"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
