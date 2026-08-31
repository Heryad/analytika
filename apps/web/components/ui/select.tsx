"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectContextType {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedLabel: string;
  setSelectedLabel: (label: string) => void;
}

const SelectContext = React.createContext<SelectContextType | null>(null);

export function Select({
  value,
  onValueChange,
  children,
  defaultValue = "",
}: {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  defaultValue?: string;
}) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);
  const [selectedLabel, setSelectedLabel] = React.useState("");

  const currentValue = value !== undefined ? value : internalValue;

  const handleValueChange = (val: string) => {
    if (onValueChange) {
      onValueChange(val);
    } else {
      setInternalValue(val);
    }
    setOpen(false);
  };

  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <SelectContext.Provider
      value={{
        value: currentValue,
        onValueChange: handleValueChange,
        open,
        setOpen,
        selectedLabel,
        setSelectedLabel,
      }}
    >
      <div ref={containerRef} className="relative w-full">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectTrigger must be used within Select");

  return (
    <button
      ref={ref}
      type="button"
      role="combobox"
      aria-expanded={context.open}
      onClick={() => context.setOpen(!context.open)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-xl border border-white/[0.08] bg-[#1F1F1F] px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#800E13] focus:ring-1 focus:ring-[#800E13] disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-xs cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className={cn("h-3.5 w-3.5 text-zinc-400 transition-transform duration-200", context.open && "rotate-180")} />
    </button>
  );
});
SelectTrigger.displayName = "SelectTrigger";

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectValue must be used within Select");

  return (
    <span className="truncate text-left block">
      {context.selectedLabel || context.value || placeholder}
    </span>
  );
}

export function SelectContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectContent must be used within Select");

  if (!context.open) return null;

  return (
    <div
      className={cn(
        "absolute z-50 mt-1.5 max-h-60 w-full min-w-[8rem] overflow-auto rounded-xl border border-white/[0.1] bg-[#262626] p-1 text-zinc-200 shadow-2xl animate-in fade-in zoom-in-95 duration-100",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SelectItem({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectItem must be used within Select");

  const isSelected = context.value === value;

  React.useEffect(() => {
    if (isSelected && typeof children === "string") {
      context.setSelectedLabel(children);
    }
  }, [isSelected, children]);

  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={() => context.onValueChange(value)}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center justify-between rounded-lg py-2 px-2.5 text-xs outline-none transition-colors hover:bg-[#1F1F1F] hover:text-white",
        isSelected && "bg-[#1F1F1F] text-white font-medium",
        className
      )}
    >
      <span className="truncate">{children}</span>
      {isSelected && (
        <Check className="h-3.5 w-3.5 text-[#800E13] shrink-0 ml-2" />
      )}
    </div>
  );
}
