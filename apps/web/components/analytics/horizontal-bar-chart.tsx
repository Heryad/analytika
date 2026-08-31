"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";

interface HorizontalBarChartProps {
  data: any[];
  nameKey?: string;
  dataKey?: string;
  color?: string;
  valueFormatter?: (value: number) => string;
}

export function HorizontalBarChart({ 
  data, 
  nameKey = "name", 
  dataKey = "percentage", 
  color = "#800E13",
  valueFormatter = (val) => `${val}%` 
}: HorizontalBarChartProps) {
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-[#1F1F1F] border border-white/[0.08] p-2.5 rounded-lg shadow-xl shadow-black/50 pointer-events-none z-50">
          <div className="text-zinc-300 font-medium text-xs mb-1 truncate max-w-[150px]">{point[nameKey]}</div>
          <div className="text-white font-mono font-bold text-sm">
            {valueFormatter(point[dataKey] || point.count || point.views)}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full min-h-[250px] pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
        >
          <XAxis type="number" hide />
          <YAxis 
            type="category" 
            dataKey={nameKey} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "#e4e4e7", fontSize: 12, fontFamily: "inherit" }}
            width={100}
          />
          <Tooltip 
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
            content={<CustomTooltip />}
          />
          <Bar dataKey={dataKey} radius={[0, 4, 4, 0]} barSize={24}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={color} fillOpacity={0.8 + (entry[dataKey] / 100) * 0.2} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
