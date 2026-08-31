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
      return (
        <div className="bg-[#1F1F1F] border border-white/[0.08] p-3 rounded-lg shadow-xl shadow-black/50 pointer-events-none z-50 relative">
          <div className="text-zinc-400 text-xs font-mono mb-1">{dataPoint.date}</div>
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
        </div>
      );
    }
    return null;
  };

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
