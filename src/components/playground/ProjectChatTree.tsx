"use client";

import { ChevronRight, FolderKanban, MessageSquare, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import type { Chat, ChatFolder } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

export function ProjectChatTree({
  folders,
  chats,
  activeChatId,
  onSelect
}: {
  folders: ChatFolder[];
  chats: Chat[];
  activeChatId: string;
  onSelect: (chatId: string) => void;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-2">
      {folders.map((folder) => {
        const folderChats = chats.filter((chat) => chat.folderId === folder.id);
        const open = !collapsed[folder.id];
        return (
          <section key={folder.id} className="rounded-card border border-surface-darkBorder/75 bg-surface-darkElevated/35 p-1.5">
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="grid h-7 w-7 place-items-center rounded-md text-muted transition hover:bg-white/7 hover:text-white"
                aria-label={`${open ? "Collapse" : "Expand"} ${folder.name}`}
                onClick={() => setCollapsed((current) => ({ ...current, [folder.id]: open }))}
              >
                <ChevronRight className={cn("h-4 w-4 transition", open && "rotate-90")} />
              </button>
              <FolderKanban className="h-3.5 w-3.5 shrink-0 text-primary-soft" />
              <p className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{folder.name}</p>
              <button type="button" className="grid h-7 w-7 place-items-center rounded-md text-muted transition hover:bg-white/7 hover:text-white" aria-label={`${folder.name} menu`}>
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>

            {open ? (
              <div className="mt-1 space-y-1 pb-1 pl-7">
                {folderChats.length ? (
                  folderChats.map((chat) => {
                    const active = activeChatId === chat.id;
                    return (
                      <button
                        key={chat.id}
                        type="button"
                        className={cn(
                          "flex w-full items-start gap-2 rounded-button px-2 py-1.5 text-left text-xs text-slate-300 transition hover:bg-white/7 hover:text-white",
                          active && "bg-primary/14 text-white shadow-[inset_0_0_0_1px_rgba(89,85,209,.24)]"
                        )}
                        onClick={() => onSelect(chat.id)}
                      >
                        <MessageSquare className={cn("mt-0.5 h-3.5 w-3.5 shrink-0 text-muted", active && "text-primary-soft")} />
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{chat.title}</span>
                          <span className="mt-0.5 block truncate text-[11px] text-muted">
                            {chat.model} · {formatDate(chat.updatedAt)}
                          </span>
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <p className="px-2 py-2 text-xs text-muted">No chats in this project.</p>
                )}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
