"use client";

import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { useUiStore } from "@/store/ui-store";

type FullScreenTarget = "playground" | "agent-studio";

export function FullScreenToggle({ page, label = false }: { page: FullScreenTarget; label?: boolean }) {
  const fullScreenPage = useUiStore((state) => state.fullScreenPage);
  const setFullScreenPage = useUiStore((state) => state.setFullScreenPage);
  const active = fullScreenPage === page;

  return (
    <Button
      size={label ? "sm" : "icon"}
      variant={active ? "primary" : "secondary"}
      aria-label={active ? "Exit full screen" : "Enter full screen"}
      title={active ? "Exit full screen" : "Enter full screen"}
      onClick={() => setFullScreenPage(active ? null : page)}
    >
      {active ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      {label ? (active ? "Exit" : "Full screen") : null}
    </Button>
  );
}
