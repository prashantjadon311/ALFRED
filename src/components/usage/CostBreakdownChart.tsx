"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const colors = ["var(--chart-primary)", "var(--chart-success)", "var(--chart-warning)", "#64748b", "var(--chart-danger)", "#0284c7"];

export function CostBreakdownChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis dataKey="name" stroke="var(--chart-axis)" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis stroke="var(--chart-axis)" tickLine={false} axisLine={false} fontSize={12} />
        <Tooltip contentStyle={{ background: "var(--chart-tooltip-bg)", border: "1px solid var(--chart-tooltip-border)", borderRadius: 12, color: "var(--chart-tooltip-text)", boxShadow: "0 14px 34px rgba(22,32,51,.12)" }} />
        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
          {data.map((item, index) => (
            <Cell key={item.name} fill={colors[index % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
