"use client";

import { MessageSquare, MoreHorizontal } from "lucide-react";
import type { Chat } from "@/lib/types";
import { getChatDateGroup } from "@/lib/date-groups";
import { cn, formatDate } from "@/lib/utils";

function groupChat(chat: Chat) {
  return getChatDateGroup(chat.updatedAt ?? chat.createdAt);
}

export function ChatHistoryGroupedList({
  chats,
  activeChatId,
  onSelect
}: {
  chats: Chat[];
  activeChatId: string;
  onSelect: (chatId: string) => void;
}) {
  const groups = ["Today", "Yesterday", "Last 7 Days", "Older"];

  return (
    <div className="space-y-5">
      {groups.map((group) => {
        const items = chats.filter((chat) => groupChat(chat) === group);
        if (!items.length) return null;
        return (
          <section key={group}>
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{group}</p>
            <div className="space-y-1">
              {items.map((chat) => {
                const active = activeChatId === chat.id;
                return (
                  <button
                    key={chat.id}
                    type="button"
                    className={cn(
                      "group flex w-full items-start gap-2 rounded-button px-2.5 py-2 text-left text-sm text-slate-300 transition hover:bg-white/7 hover:text-white",
                      active && "bg-primary/14 text-white shadow-[inset_0_0_0_1px_rgba(89,85,209,.24)]"
                    )}
                    onClick={() => onSelect(chat.id)}
                  >
                    <MessageSquare className={cn("mt-0.5 h-3.5 w-3.5 shrink-0 text-muted", active && "text-primary-soft")} />
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-1 font-medium">{chat.title}</span>
                      <span className="mt-1 block truncate text-[11px] text-muted">
                        {chat.model} · {formatDate(chat.updatedAt)}
                      </span>
                    </span>
                    <MoreHorizontal className="mt-0.5 h-4 w-4 shrink-0 text-muted opacity-0 transition group-hover:opacity-100" />
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
