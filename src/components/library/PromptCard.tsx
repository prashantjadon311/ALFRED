"use client";

import { Copy, Edit3, Heart, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { GlassCard } from "@/components/shared/GlassCard";
import type { PromptItem } from "@/lib/types";

export function PromptCard({
  prompt,
  onEdit,
  onFavorite,
  onCopy
}: {
  prompt: PromptItem;
  onEdit: (prompt: PromptItem) => void;
  onFavorite: (promptId: string) => void;
  onCopy?: (prompt: PromptItem) => void;
}) {
  return (
    <GlassCard className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-soft">{prompt.category}</p>
          <h3 className="mt-2 font-semibold text-white">{prompt.title}</h3>
        </div>
        <button type="button" aria-label={prompt.favorite ? `Remove ${prompt.title} from favorites` : `Favorite ${prompt.title}`} onClick={() => onFavorite(prompt.id)}>
          <Heart className={`h-5 w-5 transition ${prompt.favorite ? "fill-danger text-danger" : "text-muted hover:text-danger"}`} />
        </button>
      </div>
      <p className="mt-3 flex-1 text-sm leading-6 text-slate-300">{prompt.description}</p>
      <div className="mt-5 rounded-card border border-surface-darkBorder bg-surface-darkElevated/60 p-3">
        <p className="line-clamp-4 text-xs leading-5 text-muted">{prompt.prompt}</p>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2">
        <Button
          size="sm"
          variant="secondary"
          icon={<Copy className="h-4 w-4" />}
          onClick={() => {
            navigator.clipboard?.writeText(prompt.prompt);
            onCopy?.(prompt);
          }}
        >
          Copy
        </Button>
        <Button size="sm" variant="secondary" icon={<MessageSquarePlus className="h-4 w-4" />}>
          Insert
        </Button>
        <Button size="sm" variant="secondary" icon={<Edit3 className="h-4 w-4" />} onClick={() => onEdit(prompt)}>
          Edit
        </Button>
      </div>
    </GlassCard>
  );
}
