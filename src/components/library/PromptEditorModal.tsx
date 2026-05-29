"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/shared/Button";
import type { PromptItem } from "@/lib/types";

export function PromptEditorModal({
  prompt,
  open,
  onClose,
  onSave
}: {
  prompt?: PromptItem | null;
  open: boolean;
  onClose: () => void;
  onSave?: (prompt: PromptItem) => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Agent Roles");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(prompt?.title ?? "");
    setCategory(prompt?.category ?? "Agent Roles");
    setDescription(prompt?.description ?? "");
    setContent(prompt?.prompt ?? "");
  }, [open, prompt]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  const save = () => {
    const timestamp = new Date().toISOString();
    onSave?.({
      id: prompt?.id ?? `prompt-${Date.now()}`,
      title: title.trim() || "Untitled prompt",
      category,
      description: description.trim() || "Mock prompt template",
      prompt: content.trim() || "Define the agent objective, constraints, acceptance criteria, and expected structured output.",
      favorite: prompt?.favorite ?? false,
      updatedAt: timestamp
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-[90] grid place-items-center bg-black/55 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
          <motion.div
            className="glass-panel relative z-[100] w-full max-w-2xl rounded-panel p-6"
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 18, opacity: 0 }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{prompt ? "Edit Prompt" : "Create Prompt"}</h2>
              <Button size="icon" variant="ghost" aria-label="Close prompt editor" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <input className="h-11 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Prompt title" />
              <select className="h-11 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" value={category} onChange={(event) => setCategory(event.target.value)}>
                {["Product Design", "Software Architecture", "Research", "Code Review", "QA Audit", "Agent Roles", "Codex Prompts"].map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
              <input className="h-11 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Short description" />
              <textarea className="min-h-56 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated p-3 text-sm leading-6 text-white" value={content} onChange={(event) => setContent(event.target.value)} placeholder="Prompt content" />
              <Button className="w-full" variant="primary" onClick={save}>
                Save mocked prompt
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
