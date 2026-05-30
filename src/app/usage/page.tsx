"use client";

import { Coins, Gauge, TrendingUp } from "lucide-react";
import dynamic from "next/dynamic";
import { GlassCard } from "@/components/shared/GlassCard";
import { MetricCard } from "@/components/shared/MetricCard";
import { BudgetAlert } from "@/components/usage/BudgetAlert";
import { BudgetProgress } from "@/components/usage/BudgetProgress";
import { budgetRules, models, projectCosts, providerCosts, usageSeries, workflows } from "@/lib/mock-data";
import { formatCurrency, formatTokens } from "@/lib/utils";

const totalInput = usageSeries.reduce((sum, point) => sum + point.input, 0);
const totalOutput = usageSeries.reduce((sum, point) => sum + point.output, 0);
const totalCost = usageSeries.reduce((sum, point) => sum + point.cost, 0);
const workflowCosts = workflows.map((workflow) => ({ name: workflow.name.slice(0, 16), value: workflow.totalCost }));
const modelTokens = models.slice(0, 6).map((model, index) => ({ name: model.name, value: 42000 + index * 28000 }));
const UsageChart = dynamic(() => import("@/components/usage/UsageChart").then((mod) => mod.UsageChart), {
  ssr: false,
  loading: () => <div className="h-[320px] animate-pulse rounded-card border border-surface-darkBorder bg-surface-darkElevated/50" />
});
const CostBreakdownChart = dynamic(() => import("@/components/usage/CostBreakdownChart").then((mod) => mod.CostBreakdownChart), {
  ssr: false,
  loading: () => <div className="h-[260px] animate-pulse rounded-card border border-surface-darkBorder bg-surface-darkElevated/50" />
});

export default function UsagePage() {
  return (
    <div>
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Total tokens used" value={formatTokens(totalInput + totalOutput)} detail="Seven-day mocked total" icon={<Gauge className="h-4 w-4" />} />
        <MetricCard label="Input tokens" value={formatTokens(totalInput)} detail="Prompt and context volume" />
        <MetricCard label="Output tokens" value={formatTokens(totalOutput)} detail="Generated model responses" />
        <MetricCard label="Estimated cost" value={formatCurrency(totalCost)} detail="Frontend-only estimate" icon={<Coins className="h-4 w-4" />} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <GlassCard>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <TrendingUp className="h-5 w-5 text-primary-soft" /> Daily Usage
          </h2>
          <p className="mb-4 text-sm text-muted">Input and output token volume by day.</p>
          <UsageChart />
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
