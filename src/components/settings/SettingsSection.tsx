import type { ReactNode } from "react";
import { GlassCard } from "@/components/shared/GlassCard";

export function SettingsSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <GlassCard>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </GlassCard>
  );
}
