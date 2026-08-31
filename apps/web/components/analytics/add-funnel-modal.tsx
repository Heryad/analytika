"use client";

import React, { useState } from "react";
import { Plus, X, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AddFunnelModalProps {
  children?: React.ReactNode;
}

export function AddFunnelModal({ children }: AddFunnelModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [steps, setSteps] = useState([{ name: "", event: "" }, { name: "", event: "" }]);

  const addStep = () => {
    setSteps([...steps, { name: "", event: "" }]);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 2) return;
    const newSteps = [...steps];
    newSteps.splice(index, 1);
    setSteps(newSteps);
  };

  const updateStep = (index: number, field: "name" | "event", value: string) => {
    const newSteps = [...steps];
    newSteps[index][field] = value;
    setSteps(newSteps);
  };

  const handleSave = () => {
    // Mock save
    setOpen(false);
    setName("");
    setSteps([{ name: "", event: "" }, { name: "", event: "" }]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? (
          children
        ) : (
          <button className="flex items-center gap-2 bg-[#800E13] hover:bg-[#A01218] text-white px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Add Funnel</span>
          </button>
        )}
      </DialogTrigger>
      
      <DialogContent className="bg-[#1F1F1F] border-white/[0.08] text-white sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-tight">Create New Funnel</DialogTitle>
        </DialogHeader>

        <div className="mt-4 flex flex-col gap-6">
          {/* Name Input */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-300">Funnel Name</label>
            <input 
              type="text" 
              placeholder="e.g. Checkout Flow" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#262626] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#800E13] transition-colors"
            />
          </div>

          {/* Steps */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-300">Funnel Steps</label>
              <span className="text-[11px] text-zinc-500">Must be sequential</span>
            </div>
            
            <div className="flex flex-col gap-3">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-2 items-start relative group">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#262626] border border-white/[0.08] text-[10px] font-bold text-zinc-400 mt-1.5">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      placeholder="Step Name (e.g. Visited Checkout)" 
                      value={step.name}
                      onChange={(e) => updateStep(index, "name", e.target.value)}
                      className="bg-[#262626] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#800E13] transition-colors w-full"
                    />
                    <div className="relative flex">
                      <input 
                        type="text" 
                        placeholder="Event / URL match" 
                        value={step.event}
                        onChange={(e) => updateStep(index, "event", e.target.value)}
                        className="bg-[#262626] border border-white/[0.08] rounded-lg px-3 py-2 text-sm font-mono text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-[#800E13] transition-colors w-full"
                      />
                      {steps.length > 2 && (
                        <button 
                          onClick={() => removeStep(index)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-rose-400 hover:bg-white/[0.04] rounded transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Arrow between steps */}
                  {index < steps.length - 1 && (
                    <div className="absolute -bottom-2.5 left-3 w-px h-2 bg-white/[0.08]" />
                  )}
                </div>
              ))}
            </div>

            <Button 
              variant="ghost"
              size="sm"
              onClick={addStep}
              className="flex items-center gap-2 self-start text-zinc-400 hover:text-white mt-1"
            >
              <Plus className="w-4 h-4" /> Add Step
            </Button>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/[0.06]">
            <Button 
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
            >
              Create Funnel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
