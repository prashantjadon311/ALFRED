import { CheckCircle2, CircleDollarSign, LockKeyhole, MessageSquareWarning, Sparkles } from "lucide-react";
import { activityTimeline } from "@/lib/mocks/dashboard";

const icons = {
  agent: Sparkles,
  lock: LockKeyhole,
  critique: MessageSquareWarning,
  budget: CircleDollarSign,
  artifact: CheckCircle2
};

export function ActivityTimeline() {
  return (
    <div className="space-y-4">
      {activityTimeline.map((item) => {
        const Icon = icons[item.type as keyof typeof icons] ?? Sparkles;
        return (
          <div key={item.id} className="flex gap-3">
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-primary/25 bg-primary/10 text-primary-soft">
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-100">{item.title}</p>
              <p className="text-xs text-muted">{item.time}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
