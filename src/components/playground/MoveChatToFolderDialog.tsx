"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FolderInput, X } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/shared/Button";
import type { Chat } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/chat-store";

export function MoveChatToFolderDialog({
  chat,
  open,
  onClose
}: {
  chat: Chat | null;
  open: boolean;
  onClose: () => void;
}) {
  const folders = useChatStore((state) => state.folders);
  const moveChatToFolder = useChatStore((state) => state.moveChatToFolder);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  const move = (folderId?: string) => {
    if (chat) moveChatToFolder(chat.id, folderId);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && chat ? (
        <motion.div className="fixed inset-0 z-[90] grid place-items-center bg-black/55 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
          <motion.div
            className="glass-panel relative z-[100] w-full max-w-md rounded-panel p-5"
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 18, opacity: 0 }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Move chat</p>
                <p className="mt-1 line-clamp-1 text-xs text-muted">{chat.title}</p>
              </div>
              <Button size="icon" variant="ghost" aria-label="Close move dialog" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <button
                className={cn(
                  "flex w-full items-center gap-3 rounded-button border border-surface-darkBorder bg-surface-darkElevated/70 px-3 py-2 text-left text-sm text-slate-300 transition hover:border-primary/40 hover:text-white",
                  !chat.folderId && "border-primary/35 bg-primary/10 text-white"
                )}
                onClick={() => move(undefined)}
                type="button"
              >
                <FolderInput className="h-4 w-4 text-primary-soft" />
                No Folder
              </button>
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-button border border-surface-darkBorder bg-surface-darkElevated/70 px-3 py-2 text-left text-sm text-slate-300 transition hover:border-primary/40 hover:text-white",
                    chat.folderId === folder.id && "border-primary/35 bg-primary/10 text-white"
                  )}
                  onClick={() => move(folder.id)}
                  type="button"
                >
                  <FolderInput className="h-4 w-4 text-primary-soft" />
                  <span className="truncate">{folder.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
