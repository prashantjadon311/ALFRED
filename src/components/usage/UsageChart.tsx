"use client";

import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { usageSeries as defaultUsageSeries } from "@/lib/mocks/usage";
import type { UsagePoint } from "@/lib/types";

export function UsageChart({ data = defaultUsageSeries }: { data?: UsagePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="inputUsage" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-primary)" stopOpacity={0.45} />
            <stop offset="95%" stopColor="var(--chart-primary)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="outputUsage" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-success)" stopOpacity={0.36} />
            <stop offset="95%" stopColor="var(--chart-success)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis dataKey="date" stroke="var(--chart-axis)" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis stroke="var(--chart-axis)" tickLine={false} axisLine={false} fontSize={12} />
        <Tooltip contentStyle={{ background: "var(--chart-tooltip-bg)", border: "1px solid var(--chart-tooltip-border)", borderRadius: 12, color: "var(--chart-tooltip-text)", boxShadow: "0 14px 34px rgba(22,32,51,.12)" }} />
        <Legend wrapperStyle={{ color: "var(--chart-axis)", fontSize: 12 }} />
        <Area type="monotone" dataKey="input" stroke="var(--chart-primary)" fill="url(#inputUsage)" />
        <Area type="monotone" dataKey="output" stroke="var(--chart-success)" fill="url(#outputUsage)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
