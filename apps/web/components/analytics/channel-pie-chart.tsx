"use client";

import React, { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from "recharts";
import { Globe } from "lucide-react";

interface ChannelData {
  name: string;
  views: number;
  percentage: number;
  domain?: string | null;
}

interface ChannelPieChartProps {
  data: ChannelData[];
}

const COLOR_MAP: Record<string, string> = {
  Google: "#4285F4",
  Facebook: "#1877F2",
  Medium: "#FFFFFF",
  Direct: "#71717A",
  Twitter: "#1DA1F2",
  LinkedIn: "#0A66C2",
  Reddit: "#FF4500",
}

const FALLBACK_COLORS = [
  "#800E13", "#A4161A", "#BA1826", "#E5383B",
  "#F5F3F4", "#D3D3D3", "#B1A7A6", "#161A1D"
];

// Custom shape for hover effect (pops out slightly)
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className="transition-all duration-300 drop-shadow-xl"
      />
    </g>
  );
};

export function ChannelPieChart({ data }: ChannelPieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };
  
  const onPieLeave = () => {
    setActiveIndex(undefined);
  };

  const totalViews = data.reduce((acc, curr) => acc + curr.views, 0);
  const activeData = activeIndex !== undefined ? data[activeIndex] : null;

  return (
    <div className="w-full h-full flex items-stretch justify-between min-h-0">
      
      {/* Pie Chart Area */}
      <div 
        className="relative w-full md:w-1/2 flex flex-col items-center justify-center"
        onMouseLeave={onPieLeave}
      >
        
        {/* Centered Info Display */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="flex flex-col items-center justify-center transition-opacity duration-200">
            {!activeData ? (
              <div className="text-zinc-500 text-xs font-medium mb-1 uppercase tracking-wider">Total Views</div>
            ) : activeData.domain ? (
              <img src={`https://logo.clearbit.com/${activeData.domain}`} alt={activeData.name} className="w-8 h-8 object-contain mb-1 drop-shadow-md" onError={(e) => { e.currentTarget.src = `https://www.google.com/s2/favicons?domain=${activeData.domain}&sz=128` }} />
            ) : (
              <Globe className="w-7 h-7 text-zinc-400 mb-1 drop-shadow-md" />
            )}
            
            <div className="text-white font-mono font-bold text-xl leading-none my-1 tracking-tight">
              {activeData ? activeData.views.toLocaleString() : totalViews.toLocaleString()}
            </div>
            
            {activeData && (
              <div className="text-zinc-400 text-[11px] font-medium max-w-[120px] truncate text-center">
                {activeData.name} <span className="text-zinc-500 font-mono ml-0.5">{activeData.percentage}%</span>
              </div>
            )}
          </div>
        </div>

        <div className="w-full h-full min-h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={105}
                paddingAngle={2}
                dataKey="views"
                stroke="none"
                onMouseEnter={onPieEnter}
                isAnimationActive={false}
                {...({ activeIndex, activeShape: renderActiveShape } as any)}
              >
                {data.map((entry, index) => {
                  const color = COLOR_MAP[entry.name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={color}
                      className="transition-all duration-300 cursor-pointer"
                      style={{
                        filter: activeIndex === index ? `drop-shadow(0 0 12px ${color}90)` : 'none',
                        opacity: activeIndex !== undefined && activeIndex !== index ? 0.3 : 1
                      }}
                    />
                  );
                })}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Custom Legend with Icons (Hidden on mobile) */}
      <div className="hidden md:flex w-1/2 h-full flex-col pl-6 pr-2">
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1.5 pr-2">
          {data.map((entry, index) => {
            return (
              <div 
                key={entry.name}
                className="flex items-center justify-between py-1.5 px-2 rounded-lg transition-all duration-200 border border-transparent hover:bg-white/[0.02]"
              >
                <div className="flex items-center gap-2.5">
                  {entry.domain ? (
                    <img src={`https://logo.clearbit.com/${entry.domain}`} alt={entry.name} className="w-4 h-4 object-contain" onError={(e) => { e.currentTarget.src = `https://www.google.com/s2/favicons?domain=${entry.domain}&sz=64` }} />
                  ) : (
                    <Globe className="w-4 h-4 text-zinc-400" />
                  )}
                  <div className="flex flex-col">
                    <span className="text-[13px] font-medium text-zinc-200 leading-tight">{entry.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-bold text-white font-mono">{entry.views.toLocaleString()}</span>
                  <span className="text-[11px] text-zinc-500 w-6 text-right">{entry.percentage}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
