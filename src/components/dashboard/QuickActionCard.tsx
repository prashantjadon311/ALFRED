import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { AppLink } from "@/components/shared/AppLink";
import { GlassCard } from "@/components/shared/GlassCard";

export function QuickActionCard({ title, description, href, icon }: { title: string; description: string; href: string; icon: ReactNode }) {
  return (
    <AppLink href={href}>
      <GlassCard className="h-full">
        <div className="flex items-start justify-between gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-card bg-primary/15 text-primary-soft">{icon}</span>
          <ArrowRight className="h-4 w-4 text-muted" />
        </div>
        <h3 className="mt-5 font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm text-muted">{description}</p>
      </GlassCard>
    </AppLink>
  );
}
