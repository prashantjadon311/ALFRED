"use client";

import { Keyboard } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";

const shortcuts = [
  ["Cmd/Ctrl + K", "Open command palette"],
  ["Cmd/Ctrl + N", "Create a new chat"],
  ["Cmd/Ctrl + /", "Open prompt library placeholder"],
  ["Cmd/Ctrl + Enter", "Send chat message"],
  ["Esc", "Close modal, drawer, or menu"],
  ["G then D", "Dashboard shortcut placeholder"],
  ["G then P", "Playground shortcut placeholder"]
];

export default function KeyboardShortcutsPage() {
  return (
    <div className="space-y-5">
      <GlassCard className="border-primary/25 bg-primary/10">
        <p className="flex items-center gap-2 text-sm font-semibold text-primary-soft">
          <Keyboard className="h-4 w-4" /> Keyboard Shortcuts
        </p>
        <h1 className="mt-2 text-xl font-semibold text-white">A.L.F.R.E.D. Command Surface</h1>
        <p className="mt-1 text-sm text-muted">Mock shortcut map for the AI workspace and future power-user navigation.</p>
      </GlassCard>
      <div className="grid gap-3 md:grid-cols-2">
        {shortcuts.map(([keys, description]) => (
          <GlassCard key={keys} className="flex items-center justify-between gap-4 p-4">
            <p className="text-sm font-medium text-slate-200">{description}</p>
            <kbd className="shrink-0 rounded-button border border-surface-darkBorder bg-surface-darkElevated px-3 py-1.5 text-xs font-semibold text-white">{keys}</kbd>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
