"use client";

import { Folder, MessageSquarePlus, Search } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchInput } from "@/components/shared/SearchInput";
import type { Chat } from "@/lib/types";
import { cn } from "@/lib/utils";

function groupChat(chat: Chat) {
  const day = chat.createdAt.slice(0, 10);
  if (day === "2026-05-21") return "Today";
  if (day === "2026-05-20") return "Yesterday";
  if (day >= "2026-05-14") return "Last 7 Days";
  return "Older";
}

export function ChatHistoryList({
  chats,
  activeChatId,
  onSelect,
  onCreate
}: {
  chats: Chat[];
  activeChatId: string;
  onSelect: (chatId: string) => void;
  onCreate: () => void;
}) {
  const groups = ["Today", "Yesterday", "Last 7 Days", "Older"];

  return (
    <aside className="glass-panel hidden min-h-0 w-72 shrink-0 rounded-panel p-3 lg:flex lg:flex-col">
      <Button className="w-full" variant="primary" icon={<MessageSquarePlus className="h-4 w-4" />} onClick={onCreate}>
        New Chat
      </Button>
      <SearchInput className="mt-3" placeholder="Search chats" />
      <div className="mt-4 rounded-card border border-surface-darkBorder bg-surface-darkElevated/60 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted">Project folders</p>
        {["A.L.F.R.E.D. Platform", "VAPT Builder", "Research Assistant"].map((folder) => (
          <div key={folder} className="flex items-center gap-2 rounded-button px-2 py-1.5 text-sm text-slate-300">
            <Folder className="h-3.5 w-3.5 text-primary-soft" /> {folder}
          </div>
        ))}
      </div>
      <div className="custom-scrollbar mt-4 min-h-0 flex-1 overflow-y-auto">
        {!chats.length ? (
          <EmptyState title="No chats yet" description="Create a governed session to start capturing project context." />
        ) : null}
        {groups.map((group) => {
          const items = chats.filter((chat) => groupChat(chat) === group);
          if (!items.length) return null;
          return (
            <div key={group} className="mb-4">
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted">{group}</p>
              <div className="space-y-1">
                {items.map((chat) => (
                  <button
                    key={chat.id}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-button px-2 py-2 text-left text-sm text-slate-300 transition hover:bg-white/10 hover:text-white",
                      activeChatId === chat.id && "bg-primary/15 text-white"
                    )}
                    onClick={() => onSelect(chat.id)}
                  >
                    <Search className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />
                    <span className="line-clamp-2">{chat.title}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
