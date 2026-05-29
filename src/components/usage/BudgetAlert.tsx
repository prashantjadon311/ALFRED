import { AlertTriangle } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";

export function BudgetAlert({ title, description, severity }: { title: string; description: string; severity: "High" | "Medium" | "Blocker" }) {
  return (
    <div className="rounded-card border border-warning/25 bg-warning/10 p-4 transition hover:-translate-y-0.5 hover:border-warning/45">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div>
            <p className="font-semibold text-white">{title}</p>
            <p className="mt-1 text-sm leading-6 text-slate-300">{description}</p>
          </div>
        </div>
        <StatusBadge status={severity} className="w-fit shrink-0" />
      </div>
    </div>
  );
}
