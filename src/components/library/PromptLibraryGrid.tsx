"use client";

import type { PromptItem } from "@/lib/types";
import { PromptCard } from "./PromptCard";

export function PromptLibraryGrid({
  prompts,
  onEdit,
  onFavorite,
  onCopy
}: {
  prompts: PromptItem[];
  onEdit: (prompt: PromptItem) => void;
  onFavorite: (promptId: string) => void;
  onCopy?: (prompt: PromptItem) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {prompts.map((prompt) => (
        <PromptCard key={prompt.id} prompt={prompt} onEdit={onEdit} onFavorite={onFavorite} onCopy={onCopy} />
      ))}
    </div>
  );
}
