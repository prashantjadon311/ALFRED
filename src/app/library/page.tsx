"use client";

import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/shared/Button";
import { EmptyState } from "@/components/shared/EmptyState";
import { GlassCard } from "@/components/shared/GlassCard";
import { SearchInput } from "@/components/shared/SearchInput";
import { PromptEditorModal } from "@/components/library/PromptEditorModal";
import { PromptLibraryGrid } from "@/components/library/PromptLibraryGrid";
import { promptLibrary } from "@/lib/mock-data";
import type { PromptItem } from "@/lib/types";

const categories = ["All", "Product Design", "Software Architecture", "Research", "Code Review", "QA Audit", "Agent Roles", "Codex Prompts", "Favorites"];
const STORAGE_KEY = "alfred_prompt_library";

function readPrompts() {
  if (typeof window === "undefined") return promptLibrary;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PromptItem[]) : promptLibrary;
  } catch {
    return promptLibrary;
  }
}

export default function LibraryPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [items, setItems] = useState(promptLibrary);
  const [editing, setEditing] = useState<PromptItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setItems(readPrompts());
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);
  const prompts = useMemo(
    () =>
      items.filter((prompt) => {
        const matchesCategory = category === "All" || prompt.category === category || (category === "Favorites" && prompt.favorite);
        const matchesSearch = `${prompt.title} ${prompt.description} ${prompt.prompt}`.toLowerCase().includes(query.toLowerCase());
        return matchesCategory && matchesSearch;
      }),
    [category, items, query]
  );

  return (
    <div>
      <GlassCard className="mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`rounded-full border px-3 py-1.5 text-sm transition hover:-translate-y-px hover:border-primary/40 hover:bg-primary/10 ${category === item ? "border-primary bg-primary text-white shadow-glow" : "border-surface-darkBorder bg-surface-darkElevated/60 text-slate-300 hover:text-white"}`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SearchInput className="w-full sm:w-80" value={query} onChange={setQuery} placeholder="Search prompts" />
            <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(null); setModalOpen(true); }}>
              Create
            </Button>
          </div>
        </div>
      </GlassCard>

      {notice ? <p className="mb-4 rounded-card border border-success/25 bg-success/10 px-4 py-3 text-sm text-success">{notice}</p> : null}

      {prompts.length ? (
        <PromptLibraryGrid
          prompts={prompts}
          onEdit={(prompt) => {
            setEditing(prompt);
            setModalOpen(true);
          }}
          onFavorite={(promptId) => {
            setItems((current) => current.map((prompt) => (prompt.id === promptId ? { ...prompt, favorite: !prompt.favorite, updatedAt: new Date().toISOString() } : prompt)));
            setNotice("Favorite state saved locally.");
            window.setTimeout(() => setNotice(""), 1500);
          }}
          onCopy={(prompt) => {
            setNotice(`Copied "${prompt.title}" to clipboard.`);
            window.setTimeout(() => setNotice(""), 1500);
          }}
        />
      ) : (
        <EmptyState title="No prompts found" description="Try another category or create a new prompt template." />
      )}
      <PromptEditorModal
        prompt={editing}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={(prompt) => {
          setItems((current) => {
            const exists = current.some((item) => item.id === prompt.id);
            return exists ? current.map((item) => (item.id === prompt.id ? prompt : item)) : [prompt, ...current];
          });
          setNotice(`Saved "${prompt.title}" locally.`);
          window.setTimeout(() => setNotice(""), 1500);
        }}
      />
    </div>
  );
}
