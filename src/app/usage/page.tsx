"use client";

import { Coins, Gauge, TrendingUp } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { MetricCard } from "@/components/shared/MetricCard";
import { BudgetAlert } from "@/components/usage/BudgetAlert";
import { BudgetProgress } from "@/components/usage/BudgetProgress";
import { budgetRules as defaultBudgetRules, projectCosts as defaultProjectCosts, providerCosts as defaultProviderCosts, usageSeries as defaultUsageSeries } from "@/lib/mocks/usage";
import { usageService } from "@/services/usage-service";
import type { BudgetRule, UsagePoint } from "@/lib/types";
import { formatCurrency, formatTokens } from "@/lib/utils";

const workflowCosts = [
  { name: "Command Center", value: 38.74 },
  { name: "Provider Audit", value: 19.33 },
  { name: "VAPT Flow", value: 17.95 },
  { name: "Research", value: 12.01 }
];
const modelTokens = ["GPT-5", "Claude Opus", "Gemini", "Local LLM"].map((name, index) => ({ name, value: 42000 + index * 28000 }));
const UsageChart = dynamic(() => import("@/components/usage/UsageChart").then((mod) => mod.UsageChart), {
  ssr: false,
  loading: () => <div className="h-[320px] animate-pulse rounded-card border border-surface-darkBorder bg-surface-darkElevated/50" />
});
const CostBreakdownChart = dynamic(() => import("@/components/usage/CostBreakdownChart").then((mod) => mod.CostBreakdownChart), {
  ssr: false,
  loading: () => <div className="h-[260px] animate-pulse rounded-card border border-surface-darkBorder bg-surface-darkElevated/50" />
});

export default function UsagePage() {
  const [usageSeries, setUsageSeries] = useState<UsagePoint[]>(defaultUsageSeries);
  const [providerCosts, setProviderCosts] = useState(defaultProviderCosts);
  const [projectCosts, setProjectCosts] = useState(defaultProjectCosts);
  const [budgetRules, setBudgetRules] = useState<BudgetRule[]>(defaultBudgetRules);

  useEffect(() => {
    void Promise.allSettled([
      usageService.getUsageSeries().then(setUsageSeries),
      usageService.getProviderCosts().then((items) => setProviderCosts(items.map((item: any) => ({ name: item.name ?? item.provider ?? "unknown", value: item.value ?? item.cost ?? 0 })))),
      usageService.getProjectCosts().then((items) => setProjectCosts(items.map((item: any) => ({ name: item.name ?? item.project ?? "unknown", value: item.value ?? item.cost ?? 0 })))),
      usageService.getBudgetRules().then(setBudgetRules)
    ]);
  }, []);

  const totals = useMemo(() => {
    const input = usageSeries.reduce((sum, point) => sum + point.input, 0);
    const output = usageSeries.reduce((sum, point) => sum + point.output, 0);
    const cost = usageSeries.reduce((sum, point) => sum + point.cost, 0);
    return { input, output, cost };
  }, [usageSeries]);

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Total tokens used" value={formatTokens(totals.input + totals.output)} detail="Seven-day total" icon={<Gauge className="h-4 w-4" />} />
        <MetricCard label="Input tokens" value={formatTokens(totals.input)} detail="Prompt and context volume" />
        <MetricCard label="Output tokens" value={formatTokens(totals.output)} detail="Generated model responses" />
        <MetricCard label="Estimated cost" value={formatCurrency(totals.cost)} detail="Estimated spend" icon={<Coins className="h-4 w-4" />} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <GlassCard>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <TrendingUp className="h-5 w-5 text-primary-soft" /> Daily Usage
          </h2>
          <p className="mb-4 text-sm text-muted">Input and output token volume by day.</p>
          <UsageChart data={usageSeries} />
        </GlassCard>
        <GlassCard>
          <h2 className="text-lg font-semibold text-white">Budget Alerts</h2>
          <div className="mt-4 space-y-3">
            <BudgetAlert title="80% monthly budget used" description="Workspace budget is at 81% for May 2026. New Claude critic loops should require approval." severity="High" />
            <BudgetAlert title="Claude token limit near threshold" description="Claude Opus critic usage is close to the configured provider cap." severity="Medium" />
            <BudgetAlert title="Workflow paused due to budget" description="Research Claim Synthesis paused before model expansion." severity="Medium" />
            <BudgetAlert title="Project budget exceeded" description="Legacy Migration Planner requires review before another full iteration." severity="Blocker" />
          </div>
        </GlassCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <GlassCard>
          <h2 className="text-lg font-semibold text-white">Cost by Provider</h2>
          <CostBreakdownChart data={providerCosts} />
        </GlassCard>
        <GlassCard>
          <h2 className="text-lg font-semibold text-white">Cost by Project</h2>
          <CostBreakdownChart data={projectCosts} />
        </GlassCard>
        <GlassCard>
          <h2 className="text-lg font-semibold text-white">Cost by Workflow</h2>
          <CostBreakdownChart data={workflowCosts} />
        </GlassCard>
        <GlassCard>
          <h2 className="text-lg font-semibold text-white">Tokens by Model</h2>
          <CostBreakdownChart data={modelTokens} />
        </GlassCard>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-white">Budget Limits</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {budgetRules.map((rule) => (
            <BudgetProgress key={rule.id} rule={rule} />
          ))}
        </div>
      </div>
    </div>
  );
}
