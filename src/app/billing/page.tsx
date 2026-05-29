"use client";

import { ArrowRight, CreditCard, Sparkles } from "lucide-react";
import { AppLink } from "@/components/shared/AppLink";
import { Button } from "@/components/shared/Button";
import { GlassCard } from "@/components/shared/GlassCard";
import { MetricCard } from "@/components/shared/MetricCard";
import { BudgetProgress } from "@/components/usage/BudgetProgress";
import { budgetRules, providerCosts, usageSeries } from "@/lib/mock-data";
import { formatCurrency, formatTokens } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspace-store";

export default function BillingPage() {
  const activeWorkspace = useWorkspaceStore((state) => state.getActiveWorkspace());
  const totalInput = usageSeries.reduce((sum, point) => sum + point.input, 0);
  const totalOutput = usageSeries.reduce((sum, point) => sum + point.output, 0);
  const totalCost = usageSeries.reduce((sum, point) => sum + point.cost, 0);

  return (
    <div className="space-y-5">
      <GlassCard className="border-primary/25 bg-gradient-to-r from-primary/15 via-success/5 to-warning/10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-primary-soft">
              <Sparkles className="h-4 w-4" /> Pro Workspace
            </p>
            <h1 className="mt-2 text-xl font-semibold text-white">{activeWorkspace?.name ?? "Prashant / Pro Workspace"} Billing</h1>
            <p className="mt-1 text-sm text-muted">Mock usage and billing cockpit for future backend billing APIs.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" icon={<CreditCard className="h-4 w-4" />}>Upgrade plan placeholder</Button>
            <AppLink href="/usage">
              <Button variant="secondary" icon={<ArrowRight className="h-4 w-4" />}>Open Usage</Button>
            </AppLink>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Monthly tokens" value={formatTokens(totalInput + totalOutput)} detail="Mock current cycle" />
        <MetricCard label="Monthly cost" value={formatCurrency(totalCost)} detail="Estimated spend" />
        <MetricCard label="Token limit" value={formatTokens(activeWorkspace?.monthlyTokenLimit ?? 1_000_000)} detail="Workspace cap" />
        <MetricCard label="Cost limit" value={formatCurrency(activeWorkspace?.monthlyCostLimit ?? 250)} detail="Budget guardrail" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_.9fr]">
        <GlassCard>
          <h2 className="text-lg font-semibold text-white">Provider Cost Breakdown</h2>
          <div className="mt-5 space-y-4">
            {providerCosts.map((provider) => (
              <div key={provider.name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-300">{provider.name}</span>
                  <span className="font-semibold text-white">{formatCurrency(provider.value)}</span>
                </div>
                <div className="h-2 rounded-full bg-surface-darkElevated">
                  <div className="h-2 rounded-full bg-gradient-to-r from-primary to-success" style={{ width: `${Math.max(8, (provider.value / 180) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="text-lg font-semibold text-white">Recent Invoices</h2>
          <div className="mt-4 space-y-3">
            {["May 2026", "April 2026", "March 2026"].map((month, index) => (
              <div key={month} className="flex items-center justify-between rounded-card border border-surface-darkBorder bg-surface-darkElevated/55 p-3">
                <div>
                  <p className="font-semibold text-white">{month}</p>
                  <p className="text-xs text-muted">Mock invoice · no payment gateway connected</p>
                </div>
                <span className="text-sm font-semibold text-white">{formatCurrency(totalCost - index * 18)}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-white">Budget Limits</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {budgetRules.map((rule) => <BudgetProgress key={rule.id} rule={rule} />)}
        </div>
      </div>
    </div>
  );
}
