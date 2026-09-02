"use client";

import React, { useState } from "react";
import {
  Plus,
  X,
  Layers,
  Globe,
  Zap,
  ArrowDown,
  Sparkles
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FunnelStepItem {
  id?: string;
  name: string;
  type: "page" | "event";
  path?: string;
  condition?: "completed" | "does_not_complete";
  eventId?: string;
}

interface AddFunnelModalProps {
  children?: React.ReactNode;
  onAddFunnel?: (funnel: { name: string; steps: FunnelStepItem[] }) => void;
}

export function AddFunnelModal({ children, onAddFunnel }: AddFunnelModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  
  // Active step builder form on Left side
  const [stepName, setStepName] = useState("");
  const [stepType, setStepType] = useState<"page" | "event">("page");
  const [pagePath, setPagePath] = useState("");
  const [eventCondition, setEventCondition] = useState<"completed" | "does_not_complete">("completed");
  const [eventId, setEventId] = useState("");

  // Funnel Steps sequence on Right side
  const [steps, setSteps] = useState<FunnelStepItem[]>([]);

  const handleAddStep = () => {
    if (!stepName.trim()) return;
    if (stepType === "page" && !pagePath.trim()) return;
    if (stepType === "event" && !eventId.trim()) return;

    const newStep: FunnelStepItem = {
      id: `step-${Date.now()}`,
      name: stepName.trim(),
      type: stepType,
      path: stepType === "page" ? pagePath.trim() : undefined,
      condition: stepType === "event" ? eventCondition : undefined,
      eventId: stepType === "event" ? eventId.trim() : undefined,
    };

    setSteps([...steps, newStep]);
    // Reset step builder inputs
    setStepName("");
    setPagePath("");
    setEventId("");
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!name.trim() || steps.length < 2) return;
    if (onAddFunnel) {
      onAddFunnel({ name: name.trim(), steps });
    }
    setOpen(false);
    setName("");
    setStepName("");
    setPagePath("");
    setEventId("");
    setSteps([]);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setName("");
      setStepName("");
      setPagePath("");
      setEventId("");
      setSteps([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children ? (
          children
        ) : (
          <Button className="bg-[#800E13] hover:bg-[#9e1218] text-white text-xs h-9 px-3.5 rounded-xl font-medium transition-all shadow-sm cursor-pointer flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span>Add Funnel</span>
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-6xl w-[96vw] h-[94vh] max-h-[95vh] bg-[#1A1A1A] border-white/[0.1] text-white p-0 overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <DialogHeader className="p-5 border-b border-white/[0.08] shrink-0 bg-[#1F1F1F]">
          <DialogTitle className="text-base font-semibold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-zinc-400" />
            <span>Create Conversion Funnel</span>
          </DialogTitle>
        </DialogHeader>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08] overflow-hidden">
          
          {/* Left Column: Funnel Name & Step Builder (5 cols) */}
          <div className="lg:col-span-5 p-5 space-y-4 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-4">
              
              {/* 1. Funnel Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Funnel Name <span className="text-rose-400">*</span>
                </label>
                <Input 
                  type="text" 
                  placeholder="e.g. Checkout Funnel, User Onboarding" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-[#141414] border-white/[0.08] text-white text-xs h-9 rounded-xl focus:border-rose-500/50"
                />
              </div>

              {/* 2. Step Builder Card */}
              <div className="p-4 rounded-xl bg-[#141414] border border-white/[0.06] space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                    <span>Configure Step</span>
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">Step #{steps.length + 1}</span>
                </div>

                {/* Step Label */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-300">Step Label</label>
                  <Input 
                    type="text" 
                    placeholder="e.g. Viewed Pricing, Clicked Sign Up" 
                    value={stepName}
                    onChange={(e) => setStepName(e.target.value)}
                    className="bg-[#1F1F1F] border-white/[0.08] text-white text-xs h-8.5 rounded-lg focus:border-rose-500/50"
                  />
                </div>

                {/* Step Trigger Type */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-zinc-300">Step Trigger Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStepType("page")}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                        stepType === "page"
                          ? "bg-[#262626] border-[#800E13] text-white shadow-sm ring-1 ring-[#800E13]/50"
                          : "bg-[#161616] border-white/[0.04] text-zinc-400 hover:text-zinc-200 hover:border-white/[0.08]"
                      }`}
                    >
                      <Globe className={`w-3.5 h-3.5 ${stepType === "page" ? "text-sky-400" : "text-zinc-500"}`} />
                      <span className="font-semibold text-xs">Page Visit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStepType("event")}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                        stepType === "event"
                          ? "bg-[#262626] border-[#800E13] text-white shadow-sm ring-1 ring-[#800E13]/50"
                          : "bg-[#161616] border-white/[0.04] text-zinc-400 hover:text-zinc-200 hover:border-white/[0.08]"
                      }`}
                    >
                      <Zap className={`w-3.5 h-3.5 ${stepType === "event" ? "text-rose-400" : "text-zinc-500"}`} />
                      <span className="font-semibold text-xs">Custom Event</span>
                    </button>
                  </div>
                </div>

                {/* Type 1: Page Visit Input */}
                {stepType === "page" && (
                  <div className="space-y-1.5 animate-in fade-in duration-200">
                    <label className="text-[11px] font-medium text-zinc-300">Page Path / URL</label>
                    <Input 
                      type="text" 
                      placeholder="e.g. /pricing, /checkout, /products/*" 
                      value={pagePath}
                      onChange={(e) => setPagePath(e.target.value)}
                      className="bg-[#1F1F1F] border-white/[0.08] text-zinc-200 font-mono text-xs h-8.5 rounded-lg focus:border-rose-500/50"
                    />
                  </div>
                )}

                {/* Type 2: Custom Event Dropdown & Event ID */}
                {stepType === "event" && (
                  <div className="space-y-2.5 animate-in fade-in duration-200">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-zinc-300">Event Condition</label>
                      <Select
                        value={eventCondition}
                        onValueChange={(val) => setEventCondition(val as any)}
                      >
                        <SelectTrigger className="bg-[#1F1F1F] border-white/[0.08] text-zinc-200 text-xs h-8.5 rounded-lg">
                          <span className="truncate text-left block">
                            {eventCondition === "completed" ? "Visitor completed event" : "Visitor does not complete event"}
                          </span>
                        </SelectTrigger>
                        <SelectContent className="bg-[#1F1F1F] border-white/[0.08] text-zinc-200">
                          <SelectItem value="completed" className="text-xs cursor-pointer">
                            Visitor completed event
                          </SelectItem>
                          <SelectItem value="does_not_complete" className="text-xs cursor-pointer">
                            Visitor does not complete event
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-zinc-300">Event ID</label>
                      <Input 
                        type="text" 
                        placeholder="e.g. signup_btn_click, checkout_complete" 
                        value={eventId}
                        onChange={(e) => setEventId(e.target.value)}
                        className="bg-[#1F1F1F] border-white/[0.08] text-zinc-200 font-mono text-xs h-8.5 rounded-lg focus:border-rose-500/50"
                      />
                    </div>
                  </div>
                )}

                {/* Add Step Button */}
                <Button
                  type="button"
                  onClick={handleAddStep}
                  disabled={!stepName.trim() || (stepType === "page" ? !pagePath.trim() : !eventId.trim())}
                  className="w-full bg-[#262626] hover:bg-[#303030] text-white border border-white/[0.08] hover:border-white/[0.15] text-xs h-9 rounded-xl font-medium cursor-pointer transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-rose-400" />
                  <span>Add Step to Funnel</span>
                </Button>
              </div>

            </div>
          </div>

          {/* Right Column: Funnel Sequence (7 cols) */}
          <div className="lg:col-span-7 p-5 space-y-4 overflow-y-auto bg-[#141414] flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Funnel Sequence ({steps.length} {steps.length === 1 ? "step" : "steps"})
                </span>

                {steps.length < 2 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Min 2 steps required
                  </span>
                )}
              </div>

              {/* Sequence Cards List */}
              {steps.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/[0.08] p-12 text-center space-y-2 bg-[#181818]/40 my-4">
                  <Layers className="w-8 h-8 text-zinc-600 mx-auto" />
                  <div className="text-xs font-semibold text-zinc-400">No Steps in Sequence</div>
                  <p className="text-[11px] text-zinc-600 max-w-xs mx-auto">
                    Configure your first milestone step on the left and click "Add Step to Funnel".
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 overflow-y-auto pr-1 custom-scrollbar">
                  {steps.map((step, index) => (
                    <div key={step.id} className="relative group">
                      {/* Step Card */}
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#1A1A1A] border border-white/[0.06] hover:border-white/[0.12] transition-all shadow-sm">
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Step Number Badge */}
                          <div className="w-7 h-7 rounded-lg bg-[#262626] border border-white/[0.08] flex items-center justify-center text-xs font-mono font-bold text-white shrink-0 shadow-inner">
                            {index + 1}
                          </div>

                          {/* Step Details */}
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-white truncate">
                              {step.name}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {step.type === "page" ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                  <Globe className="w-2.5 h-2.5" />
                                  <span className="truncate max-w-[200px]">{step.path}</span>
                                </span>
                              ) : (
                                <>
                                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                    <Zap className="w-2.5 h-2.5" />
                                    <span className="truncate max-w-[160px]">{step.eventId}</span>
                                  </span>
                                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                                    step.condition === "completed"
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  }`}>
                                    {step.condition === "completed" ? "completed" : "not completed"}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Remove Action */}
                        <button
                          type="button"
                          onClick={() => removeStep(index)}
                          className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer shrink-0 ml-2"
                          title="Remove Step"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Connective Line & Arrow indicator */}
                      {index < steps.length - 1 && (
                        <div className="flex items-center justify-center my-1.5 text-zinc-600">
                          <ArrowDown className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-end gap-2.5 p-4 border-t border-white/[0.08] bg-[#1F1F1F] shrink-0">
          <Button 
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            className="text-zinc-400 hover:text-white text-xs h-9 px-3 rounded-xl cursor-pointer"
          >
            Cancel
          </Button>
          <Button 
            type="button"
            size="sm"
            disabled={!name.trim() || steps.length < 2}
            onClick={handleSave}
            className="bg-[#800E13] hover:bg-[#9e1218] text-white text-xs font-medium h-9 px-5 rounded-xl cursor-pointer disabled:opacity-40 shadow-xs transition-all"
          >
            Create Funnel
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
