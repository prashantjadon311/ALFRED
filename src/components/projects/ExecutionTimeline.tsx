import { CheckCircle2, Circle, PlayCircle } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";

const steps = [
  ["Requirement locked", "Original motive and constraints signed"],
  ["Designer pass", "GPT-5 generated interaction structure"],
  ["Architect pass", "Gemini validating bounded contexts"],
  ["Critic pass", "Claude checking drift and missing states"],
  ["Approval", "Waiting for human decision"]
];

export function ExecutionTimeline() {
  return (
    <GlassCard>
      <h2 className="text-lg font-semibold text-white">Execution Timeline</h2>
      <div className="mt-5 space-y-4">
        {steps.map(([title, detail], index) => {
          const Icon = index < 2 ? CheckCircle2 : index === 2 ? PlayCircle : Circle;
          return (
            <div key={title} className="relative flex gap-3">
              {index < steps.length - 1 ? <span className="absolute left-2.5 top-6 h-8 w-px bg-surface-darkBorder" /> : null}
              <Icon className={`relative z-10 mt-0.5 h-5 w-5 ${index < 3 ? "text-success" : "text-muted"}`} />
              <div>
                <p className="font-semibold text-white">{title}</p>
                <p className="text-sm text-muted">{detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
