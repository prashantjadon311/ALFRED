"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { usageSeries } from "@/lib/mock-data";

export function MiniUsageChart({ type = "area" }: { type?: "area" | "bar" }) {
  if (type === "bar") {
    return (
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={usageSeries}>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="date" stroke="var(--chart-axis)" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis stroke="var(--chart-axis)" tickLine={false} axisLine={false} fontSize={12} />
          <Tooltip contentStyle={{ background: "var(--chart-tooltip-bg)", border: "1px solid var(--chart-tooltip-border)", borderRadius: 12, color: "var(--chart-tooltip-text)", boxShadow: "0 14px 34px rgba(22,32,51,.12)" }} />
          <Bar dataKey="cost" radius={[8, 8, 0, 0]} fill="var(--chart-primary)" />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={230}>
      <AreaChart data={usageSeries}>
        <defs>
          <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-primary)" stopOpacity={0.45} />
            <stop offset="95%" stopColor="var(--chart-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis dataKey="date" stroke="var(--chart-axis)" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis stroke="var(--chart-axis)" tickLine={false} axisLine={false} fontSize={12} />
        <Tooltip contentStyle={{ background: "var(--chart-tooltip-bg)", border: "1px solid var(--chart-tooltip-border)", borderRadius: 12, color: "var(--chart-tooltip-text)", boxShadow: "0 14px 34px rgba(22,32,51,.12)" }} />
        <Area type="monotone" dataKey="input" stackId="1" stroke="var(--chart-primary)" fill="url(#tokenGradient)" />
        <Area type="monotone" dataKey="output" stackId="1" stroke="var(--chart-success)" fill="rgba(34,197,94,.16)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
