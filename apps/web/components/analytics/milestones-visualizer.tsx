"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Target, TrendingUp, Plus, DollarSign, Calendar, Mail,
  FileText, Sparkles, CheckCircle2, ArrowUpRight, Award,
  MousePointerClick, Zap, MoreHorizontal, Layers, ChevronRight,
  Trash2, X, AlertCircle, RefreshCw, Loader2
} from "lucide-react";
import { MilestoneItem, milestonesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface MilestonesVisualizerProps {
  websiteId?: string;
  timeRange?: string;
  readOnly?: boolean;
}

export function MilestonesVisualizer({
  websiteId,
  timeRange = "30d",
  readOnly = false,
}: MilestonesVisualizerProps) {
  const [items, setItems] = useState<MilestoneItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "revenue" | "event" | "pageview">("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for new milestone
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<"event" | "pageview" | "revenue">("event");
  const [formTrigger, setFormTrigger] = useState("");
  const [formTarget, setFormTarget] = useState(1000);
  const [formRevenue, setFormRevenue] = useState(0);
  const [formError, setFormError] = useState("");

  const loadMilestones = useCallback(async () => {
    if (!websiteId) return;
    setIsLoading(true);
    try {
      const res = await milestonesApi.list(websiteId, timeRange);
      if (res.success && res.milestones) {
        setItems(res.milestones);
      }
    } catch (err) {
      console.error("Failed to load milestones:", err);
    } finally {
      setIsLoading(false);
    }
  }, [websiteId, timeRange]);

  useEffect(() => {
    loadMilestones();
  }, [loadMilestones]);

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteId) return;
    if (!formName.trim()) {
      setFormError("Please enter a milestone name.");
      return;
    }
    if (!formTrigger.trim()) {
      setFormError("Please specify a target event name or URL path.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const res = await milestonesApi.create(websiteId, {
        name: formName.trim(),
        type: formType,
        trigger: formTrigger.trim(),
        targetCount: Number(formTarget) || 1000,
        revenuePerCompletion: Number(formRevenue) || 0,
      });

      if (res.success) {
        setIsAddModalOpen(false);
        setFormName("");
        setFormTrigger("");
        setFormTarget(1000);
        setFormRevenue(0);
        loadMilestones();
      } else {
        setFormError(res.error || "Failed to create milestone");
      }
    } catch (err: any) {
      setFormError(err.message || "Failed to create milestone");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [deleteTarget, setDeleteTarget] = useState<MilestoneItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDeleteMilestone = async () => {
    if (!websiteId || !deleteTarget) return;
    setIsDeleting(true);
    try {
      await milestonesApi.delete(websiteId, deleteTarget.id);
      setItems((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete milestone:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateTemplate = async (name: string, type: "event" | "pageview" | "revenue", trigger: string, targetCount: number, revenuePerCompletion: number = 0) => {
    if (!websiteId) return;
    try {
      await milestonesApi.create(websiteId, {
        name,
        type,
        trigger,
        targetCount,
        revenuePerCompletion,
      });
      loadMilestones();
    } catch (err) {
      console.error("Failed to apply template:", err);
    }
  };

  const filteredItems = items.filter(
    (item) => activeFilter === "all" || item.type === activeFilter
  );

  const totalRevenue = items.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const totalCompletions = items.reduce((sum, item) => sum + (item.completions || 0), 0);
  const avgCR = items.length > 0
    ? (items.reduce((sum, item) => sum + item.conversionRate, 0) / items.length).toFixed(1)
    : "0.0";

  const getMilestoneIcon = (item: MilestoneItem) => {
    if (item.type === "revenue") return <DollarSign className="w-5 h-5 text-emerald-400" />;
    if (item.name.toLowerCase().includes("demo") || item.name.toLowerCase().includes("call")) {
      return <Calendar className="w-5 h-5 text-indigo-400" />;
    }
    if (item.name.toLowerCase().includes("newsletter") || item.name.toLowerCase().includes("email")) {
      return <Mail className="w-5 h-5 text-amber-400" />;
    }
    if (item.type === "pageview") return <FileText className="w-5 h-5 text-sky-400" />;
    return <Zap className="w-5 h-5 text-rose-400" />;
  };

  const getBadgeStyle = (type: string) => {
    if (type === "revenue") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (type === "pageview") return "bg-sky-500/10 text-sky-400 border-sky-500/20";
    return "bg-rose-500/10 text-rose-400 border-rose-500/20";
  };

  if (isLoading && items.length === 0) {
    return (
      <div className="flex-1 flex flex-col gap-4 min-h-[360px] animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-xl bg-white/[0.03] border border-white/[0.04] p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-white/[0.05]" />
                <div className="w-14 h-4 rounded bg-white/[0.05]" />
              </div>
              <div className="space-y-2">
                <div className="w-32 h-4 rounded bg-white/[0.05]" />
                <div className="w-full h-1.5 rounded-full bg-white/[0.04]" />
              </div>
              <div className="flex justify-between">
                <div className="w-20 h-3 rounded bg-white/[0.04]" />
                <div className="w-12 h-3 rounded bg-white/[0.04]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    if (readOnly) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/[0.08] rounded-xl p-8 text-center bg-[#1F1F1F]/40 space-y-3 min-h-[220px]">
          <div className="w-10 h-10 rounded-xl bg-[#2A2A2A] border border-white/[0.08] flex items-center justify-center shadow-inner">
            <Target className="w-5 h-5 text-rose-500" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-sm font-semibold text-white">No Milestones Defined</h3>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/[0.08] rounded-xl p-8 text-center bg-[#1F1F1F]/40 space-y-4 min-h-[360px]">
        <div className="w-12 h-12 rounded-2xl bg-[#2A2A2A] border border-white/[0.08] flex items-center justify-center shadow-inner">
          <Target className="w-6 h-6 text-rose-500" />
        </div>
        <div className="space-y-1 max-w-md">
          <h3 className="text-base font-semibold text-white">No Milestones Defined Yet</h3>
          <p className="text-xs text-zinc-400">
            Define your high-intent conversion goals (e.g. Signups, Demo Requests, Purchases) to track real-time target progress and top traffic drivers.
          </p>
        </div>

        {/* Quick Setup 1-Click Templates */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => handleCreateTemplate("Pro Plan Upgrades", "revenue", "purchase_pro", 1500, 49)}
            className="text-xs font-mono bg-[#2A2A2A] hover:bg-[#333] text-zinc-300 border border-white/[0.08] px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> + Add Pro Plan ($49)
          </button>
          <button
            onClick={() => handleCreateTemplate("Demo Call Bookings", "event", "book_demo", 500)}
            className="text-xs font-mono bg-[#2A2A2A] hover:bg-[#333] text-zinc-300 border border-white/[0.08] px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-400" /> + Add Book Demo
          </button>
          <button
            onClick={() => handleCreateTemplate("Newsletter Subscribers", "event", "newsletter_signup", 3000)}
            className="text-xs font-mono bg-[#2A2A2A] hover:bg-[#333] text-zinc-300 border border-white/[0.08] px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5 text-amber-400" /> + Add Newsletter
          </button>
          <button
            onClick={() => handleCreateTemplate("Checkout Success", "pageview", "/checkout/success", 2000)}
            className="text-xs font-mono bg-[#2A2A2A] hover:bg-[#333] text-zinc-300 border border-white/[0.08] px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-sky-400" /> + Add /checkout/success
          </button>
        </div>

        <Button
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#800E13] hover:bg-[#9B1218] text-white font-mono text-xs gap-1.5 border border-white/[0.08] shadow-sm cursor-pointer mt-2"
        >
          <Plus className="w-3.5 h-3.5" /> Set Custom Milestone
        </Button>

        {/* Add Milestone Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#1E1E1E] border border-white/[0.1] rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5 text-left">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-rose-500" />
                  <h3 className="text-base font-semibold text-white">Define Conversion Milestone</h3>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.05] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-rose-950/40 border border-rose-500/20 rounded-lg text-rose-400 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateMilestone} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-zinc-300">Milestone Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Pro Plan Subscriptions"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-[#141414] border border-white/[0.08] focus:border-rose-500 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none font-sans"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-zinc-300">Goal Trigger Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "event", label: "Custom Event" },
                      { id: "pageview", label: "Page Destination" },
                      { id: "revenue", label: "Revenue Target" },
                    ].map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => setFormType(t.id as any)}
                        className={`text-xs font-mono py-2 rounded-lg border text-center transition-all cursor-pointer ${formType === t.id
                          ? "bg-[#2A2A2A] text-white border-rose-500/60 shadow-sm"
                          : "bg-[#141414] text-zinc-400 border-white/[0.06] hover:text-zinc-200"
                          }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-zinc-300">
                    {formType === "pageview" ? "Page Path Destination" : "Target Event Name"}
                  </label>
                  <input
                    type="text"
                    placeholder={formType === "pageview" ? "/checkout/success" : "purchase_pro"}
                    value={formTrigger}
                    onChange={(e) => setFormTrigger(e.target.value)}
                    className="w-full bg-[#141414] border border-white/[0.08] focus:border-rose-500 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none font-mono"
                    required
                  />
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {formType === "pageview" ? "Matches when a visitor views this pathname" : "Matches when analytika.track('event_name') is triggered"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-zinc-300">Monthly Target Count</label>
                    <input
                      type="number"
                      min="1"
                      value={formTarget}
                      onChange={(e) => setFormTarget(Number(e.target.value))}
                      className="w-full bg-[#141414] border border-white/[0.08] focus:border-rose-500 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-zinc-300">Value per Conversion ($)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formRevenue}
                      onChange={(e) => setFormRevenue(Number(e.target.value))}
                      className="w-full bg-[#141414] border border-white/[0.08] focus:border-rose-500 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsAddModalOpen(false)}
                    className="text-xs font-mono text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#800E13] hover:bg-[#9B1218] text-white font-mono text-xs cursor-pointer"
                  >
                    {isSubmitting ? "Creating..." : "Save Milestone"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header Bar with Filter Pills, Metrics, and Add Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5">
        <div className="flex items-center gap-2">
          {(["all", "revenue", "event", "pageview"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`text-[12px] font-mono capitalize px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${activeFilter === filter
                ? "bg-[#2A2A2A] text-white border-white/[0.15] shadow-sm"
                : "bg-[#1F1F1F] text-zinc-400 border-transparent hover:text-zinc-200"
                }`}
            >
              {filter === "all" ? "All Milestones" : filter === "event" ? "Event Goals" : filter === "pageview" ? "Page Destinations" : "Revenue Targets"}
            </button>
          ))}
        </div>

        {/* Aggregate Milestone Metrics Pill & Add Button */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="hidden sm:flex items-center gap-1.5 bg-[#1F1F1F] px-3 py-1.5 rounded-lg border border-white/[0.04]">
            <span className="text-zinc-500">Total Conv:</span>
            <span className="text-white font-bold">{totalCompletions.toLocaleString()}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 bg-[#1F1F1F] px-3 py-1.5 rounded-lg border border-white/[0.04]">
            <span className="text-zinc-500">Avg Rate:</span>
            <span className="text-emerald-400 font-bold">{avgCR}%</span>
          </div>
          {totalRevenue > 0 && (
            <div className="flex items-center gap-1.5 bg-emerald-950/30 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20">
              <span className="text-emerald-500">Attributed:</span>
              <span className="font-bold font-mono">${totalRevenue.toLocaleString()}</span>
            </div>
          )}

          {!readOnly && (
            <Button
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#800E13] hover:bg-[#9B1218] text-white font-mono text-xs gap-1.5 border border-white/[0.08] shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Set Milestone
            </Button>
          )}
        </div>
      </div>

      {/* Grid of Milestone Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 flex-1">
        {filteredItems.map((item) => {
          const progressPct = Math.min(100, Math.round((item.completions / (item.targetCount || 1)) * 100));

          return (
            <div
              key={item.id}
              className="bg-[#1F1F1F] hover:bg-[#232323] border border-white/[0.06] hover:border-white/[0.12] rounded-xl p-4 flex flex-col justify-between transition-all group shadow-lg hover:shadow-xl relative overflow-hidden"
            >
              {/* Delete Button (visible on hover) */}
              {!readOnly && (
                <button
                  onClick={() => setDeleteTarget(item)}
                  title="Delete Milestone"
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-rose-950/50 text-zinc-500 hover:text-rose-400 transition-all cursor-pointer z-10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Top Row: Icon + Type Pill + Trigger */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2 pr-6">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-lg bg-[#2A2A2A] border border-white/[0.06] flex items-center justify-center shrink-0">
                      {getMilestoneIcon(item)}
                    </div>
                    <div>
                      <h4 className="text-[14px] font-semibold text-white tracking-tight leading-snug group-hover:text-rose-400 transition-colors">
                        {item.name}
                      </h4>
                      <span className="text-[11px] font-mono text-zinc-400 truncate block max-w-[150px]">
                        {item.trigger}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Big Stat Block */}
                <div className="pt-2 flex items-baseline justify-between border-t border-white/[0.04]">
                  <div>
                    <div className="text-[11px] font-mono text-zinc-400">Conversion Rate</div>
                    <div className="text-2xl font-bold font-mono text-white tracking-tight flex items-baseline gap-2">
                      {item.conversionRate}%
                      {item.completions > 0 && typeof item.trend === "number" && item.trend > 0 ? (
                        <span className="text-[11px] font-medium font-mono text-emerald-400 flex items-center">
                          <TrendingUp className="w-3 h-3 mr-0.5 inline" />+{item.trend}%
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-mono text-zinc-400">Completions</div>
                    <div className="text-lg font-bold font-mono text-zinc-200">
                      {item.completions.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Target Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-zinc-500">Target: {item.targetCount.toLocaleString()}</span>
                    <span className="text-zinc-300 font-semibold">{progressPct}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#2A2A2A] rounded-full overflow-hidden border border-white/[0.04]">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${item.type === "revenue"
                        ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                        : "bg-gradient-to-r from-rose-600 to-amber-500"
                        }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Row: Top Traffic Driver & Revenue */}
              <div className="pt-3 mt-3 border-t border-white/[0.04] flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <div className="flex items-center gap-1.5 truncate">
                  <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">Top: <strong className="text-zinc-200">{item.topSource.name}</strong> ({item.topSource.rate}%)</span>
                </div>
                {item.revenue > 0 && (
                  <span className="text-emerald-400 font-bold shrink-0">
                    ${item.revenue.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Milestone Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1E1E1E] border border-white/[0.1] rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-rose-500" />
                <h3 className="text-base font-semibold text-white">Define Conversion Milestone</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.05] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/20 rounded-lg text-rose-400 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateMilestone} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-zinc-300">Milestone Name</label>
                <input
                  type="text"
                  placeholder="e.g. Pro Plan Subscriptions"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-[#141414] border border-white/[0.08] focus:border-rose-500 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none font-sans"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-zinc-300">Goal Trigger Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "event", label: "Custom Event" },
                    { id: "pageview", label: "Page Destination" },
                    { id: "revenue", label: "Revenue Target" },
                  ].map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setFormType(t.id as any)}
                      className={`text-xs font-mono py-2 rounded-lg border text-center transition-all cursor-pointer ${formType === t.id
                        ? "bg-[#2A2A2A] text-white border-rose-500/60 shadow-sm"
                        : "bg-[#141414] text-zinc-400 border-white/[0.06] hover:text-zinc-200"
                        }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-zinc-300">
                  {formType === "pageview" ? "Page Path Destination" : "Target Event Name"}
                </label>
                <input
                  type="text"
                  placeholder={formType === "pageview" ? "/checkout/success" : "purchase_pro"}
                  value={formTrigger}
                  onChange={(e) => setFormTrigger(e.target.value)}
                  className="w-full bg-[#141414] border border-white/[0.08] focus:border-rose-500 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none font-mono"
                  required
                />
                <span className="text-[11px] text-zinc-500 font-mono">
                  {formType === "pageview" ? "Matches when a visitor views this pathname" : "Matches when analytika.track('event_name') is triggered"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-zinc-300">Monthly Target Count</label>
                  <input
                    type="number"
                    min="1"
                    value={formTarget}
                    onChange={(e) => setFormTarget(Number(e.target.value))}
                    className="w-full bg-[#141414] border border-white/[0.08] focus:border-rose-500 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-zinc-300">Value per Conversion ($)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formRevenue}
                    onChange={(e) => setFormRevenue(Number(e.target.value))}
                    className="w-full bg-[#141414] border border-white/[0.08] focus:border-rose-500 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-xs font-mono text-zinc-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#800E13] hover:bg-[#9B1218] text-white font-mono text-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmitting ? "Creating..." : "Save Milestone"}</span>
                </Button>
              </div>
            </form>
          </div>
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
                <h3 className="text-base font-semibold text-white">Delete Milestone?</h3>
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
                onClick={confirmDeleteMilestone}
                className="bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs cursor-pointer flex items-center gap-1.5"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? "Deleting..." : "Delete Milestone"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
