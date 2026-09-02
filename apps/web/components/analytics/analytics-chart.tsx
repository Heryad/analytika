"use client";

import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

interface AnalyticsChartProps {
  data: any[];
  activeMetric: "visitors" | "revenue" | "conversionRate" | "bounceRate" | "sessionTime";
}

export function AnalyticsChart({ data, activeMetric }: AnalyticsChartProps) {
  const currentMetricKey = activeMetric;

  // Axis Formatter
  const yAxisFormatter = (val: number) => {
    if (activeMetric === "revenue") return `$${val.toLocaleString()}`;
    if (activeMetric === "conversionRate" || activeMetric === "bounceRate") return `${val}%`;
    if (activeMetric === "sessionTime") return `${Math.floor(val / 60)}m`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return val.toLocaleString();
  };

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      const totalVis = dataPoint.visitors || 0;
      const newVis = dataPoint.newVisitors ?? Math.round(totalVis * 0.76);
      const retVis = dataPoint.returningVisitors ?? Math.max(0, totalVis - newVis);
      const newPct = totalVis > 0 ? Math.round((newVis / totalVis) * 100) : 0;
      const retPct = totalVis > 0 ? Math.round((retVis / totalVis) * 100) : 0;

      return (
        <div className="bg-[#1F1F1F] border border-white/[0.08] p-3 rounded-lg shadow-xl shadow-black/50 pointer-events-none z-50 relative min-w-[170px]">
          <div className="text-zinc-400 text-xs font-mono mb-2 pb-1 border-b border-white/[0.06]">{dataPoint.date}</div>
          
          {activeMetric === "visitors" ? (
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <span className="w-2 h-2 rounded-full bg-[#E11D48]" /> Total:
                </span>
                <span className="text-white font-bold">{totalVis.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-rose-400 pt-0.5">
                <span className="flex items-center gap-1">✨ New:</span>
                <span className="font-bold text-white">{newVis.toLocaleString()} <span className="text-zinc-500 font-normal text-[10px]">({newPct}%)</span></span>
              </div>
              <div className="flex items-center justify-between gap-3 text-emerald-400">
                <span className="flex items-center gap-1">🔄 Returning:</span>
                <span className="font-bold text-white">{retVis.toLocaleString()} <span className="text-zinc-500 font-normal text-[10px]">({retPct}%)</span></span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#E11D48] shadow-[0_0_8px_rgba(225,29,72,0.8)]" />
              <div className="text-white font-bold font-mono text-sm">
                {activeMetric === "revenue" ? `$${dataPoint.revenue.toLocaleString()}` : 
                 activeMetric === "conversionRate" ? `${dataPoint.conversionRate.toFixed(1)}%` : 
                 activeMetric === "bounceRate" ? `${dataPoint.bounceRate.toFixed(1)}%` : 
                 activeMetric === "sessionTime" ? `${Math.floor(dataPoint.sessionTime / 60)}m ${Math.floor(dataPoint.sessionTime % 60)}s` : 
                 dataPoint[currentMetricKey].toLocaleString()}
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full min-h-[220px] flex flex-col items-center justify-center text-center p-6 text-zinc-500 select-none">
        <p className="text-xs font-mono">No telemetry events recorded for this period</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#800E13" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#800E13" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="returnGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#059669" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
          
          <XAxis 
            dataKey="label" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "#71717a", fontSize: 11, fontFamily: "monospace" }} 
            minTickGap={20}
          />
          
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "#71717a", fontSize: 11, fontFamily: "monospace" }}
            tickFormatter={yAxisFormatter}
            width={60}
          />

          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ stroke: "rgba(255,255,255,0.15)", strokeWidth: 1, strokeDasharray: "4 4" }}
            isAnimationActive={false}
          />

          {/* Returning Visitors Layer (Only on visitors metric) */}
          {activeMetric === "visitors" && (
            <Area
              type="monotone"
              dataKey="returningVisitors"
              stroke="#10B981"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              fillOpacity={1}
              fill="url(#returnGradient)"
              animationDuration={800}
              activeDot={{ r: 4, fill: "#10B981", stroke: "#1F1F1F", strokeWidth: 2 }}
            />
          )}

          {/* Main Selected Metric Layer */}
          <Area
            type="monotone"
            dataKey={currentMetricKey}
            stroke="#800E13"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#chartGradient)"
            animationDuration={800}
            activeDot={{ r: 5, fill: "#E11D48", stroke: "#1F1F1F", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
