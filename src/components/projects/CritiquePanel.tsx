import { MessageSquareWarning } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { CritiqueIssue, Severity } from "@/lib/types";

const severities: Severity[] = ["Blocker", "High", "Medium", "Low"];

export function CritiquePanel({ issues }: { issues: CritiqueIssue[] }) {
  return (
    <GlassCard>
      <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
        <MessageSquareWarning className="h-5 w-5 text-warning" /> Claude Critique Issues
      </h2>
      <p className="mt-1 text-sm text-muted">Strict audit lanes for blockers, risk, and accepted tradeoffs.</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {severities.map((severity) => {
          const items = issues.filter((issue) => issue.severity === severity);
          return (
            <div key={severity} className="rounded-card border border-surface-darkBorder bg-surface-darkElevated/50 p-3 transition hover:-translate-y-0.5 hover:border-primary/35">
              <div className="mb-3 flex items-center justify-between">
                <StatusBadge status={severity} />
                <span className="text-xs text-muted">{items.length} issue(s)</span>
              </div>
              <div className="space-y-3">
                {!items.length ? (
                  <div className="rounded-card border border-dashed border-surface-darkBorder bg-black/15 p-4 text-center text-sm text-muted">
                    No {severity.toLowerCase()} issues
                  </div>
                ) : null}
                {items.map((issue) => (
                  <div key={issue.id} className="rounded-card border border-transparent bg-black/15 p-3 transition hover:border-surface-darkBorder">
                    <p className="font-semibold text-white">{issue.title}</p>
                    <p className="mt-1 text-xs text-muted">{issue.affectedArea}</p>
                    <p className="mt-2 text-sm leading-5 text-slate-300">{issue.recommendation}</p>
                    <div className="mt-3"><StatusBadge status={issue.status} /></div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {!issues.length ? <EmptyState title="No critique issues" description="Claude has not reported blockers or review findings for this run." /> : null}
    </GlassCard>
  );
}
