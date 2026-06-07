"use client";

import { Bot, Boxes, BrainCircuit, ChartNoAxesCombined, FolderKanban, Library, Search, Settings, Workflow, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUiStore } from "@/store/ui-store";
import { Button } from "./Button";

const commands = [
  { label: "Dashboard", href: "/dashboard", icon: ChartNoAxesCombined },
  { label: "Playground", href: "/playground", icon: Bot },
  { label: "Compare Models", href: "/compare", icon: BrainCircuit },
  { label: "Agent Studio", href: "/agent-studio", icon: Workflow },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Workflow Runs", href: "/workflows", icon: Boxes },
  { label: "Prompt Library", href: "/library", icon: Library },
  { label: "Settings", href: "/settings", icon: Settings }
];

export function CommandPalette() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const open = useUiStore((state) => state.commandPaletteOpen);
  const setOpen = useUiStore((state) => state.setCommandPaletteOpen);
  const filtered = commands.filter((command) => command.label.toLowerCase().includes(query.toLowerCase()));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-black/55 p-4 backdrop-blur-sm">
      <div className="glass-panel mx-auto mt-24 w-full max-w-2xl overflow-hidden rounded-panel transition duration-150">
        <div className="flex items-center border-b border-surface-darkBorder px-4">
          <Search className="h-5 w-5 text-muted" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search commands, pages, and actions"
            className="h-14 flex-1 bg-transparent px-3 text-sm text-white placeholder:text-muted"
          />
          <Button size="icon" variant="ghost" aria-label="Close command palette" onClick={() => setOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
          {filtered.map((command) => {
            const Icon = command.icon;
            return (
              <button
                key={command.href}
                className="flex w-full items-center gap-3 rounded-card px-3 py-3 text-left text-sm text-slate-200 transition hover:bg-white/7"
                onClick={() => {
                  router.push(command.href);
                  setOpen(false);
                }}
              >
                <span className="grid h-9 w-9 place-items-center rounded-button bg-primary/15 text-primary-soft">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="font-medium">{command.label}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between border-t border-surface-darkBorder px-4 py-3 text-xs text-muted">
          <span>Navigate with keyboard search</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}
