import { CheckCircle2, Circle } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { GlassCard } from "@/components/shared/GlassCard";
import type { ProjectTimelineEvent } from "@/lib/mocks/project-detail";
import { formatDate } from "@/lib/utils";

export function ExecutionTimeline({ events }: { events: ProjectTimelineEvent[] }) {
  return (
    <GlassCard>
      <h2 className="text-lg font-semibold text-white">Execution Timeline</h2>
      <div className="mt-5 space-y-4">
        {!events.length ? <EmptyState title="No execution events" description="Workflow activity will appear here after the first run." /> : null}
        {events.map((event, index) => {
          const Icon = index === 0 ? Circle : CheckCircle2;
          const title = event.eventType.replace(/[._]/g, " ");
          return (
            <div key={event.id} className="relative flex gap-3">
              {index < events.length - 1 ? <span className="absolute left-2.5 top-6 h-8 w-px bg-surface-darkBorder" /> : null}
              <Icon className={`relative z-10 mt-0.5 h-5 w-5 ${index === 0 ? "text-primary-soft" : "text-success"}`} />
              <div>
                <p className="font-semibold capitalize text-white">{title}</p>
                <p className="text-sm text-muted">{event.message ?? event.nodeKey ?? formatDate(event.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
