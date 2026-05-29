"use client";

import { Download, GitBranch, Menu, MoreHorizontal, Share2 } from "lucide-react";
import { FullScreenToggle } from "@/components/shared/FullScreenToggle";
import { IconButton } from "@/components/shared/IconButton";
import type { Chat } from "@/lib/types";

export function ChatHeader({
  chat,
  onOpenConversations,
  onBranch
}: {
  chat: Chat;
  onOpenConversations?: () => void;
  onBranch: () => void;
}) {
  return (
    <header className="flex min-h-14 items-center gap-3 border-b border-surface-darkBorder/80 bg-surface-dark/35 px-3 backdrop-blur-md sm:px-4">
      {onOpenConversations ? (
        <IconButton label="Open conversations" className="lg:hidden" onClick={onOpenConversations}>
          <Menu className="h-4 w-4" />
        </IconButton>
      ) : null}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold text-white">{chat.title}</h1>
        <p className="mt-0.5 truncate text-xs text-muted">
          {chat.model} · {chat.messages.length} messages
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <IconButton label="Share chat">
          <Share2 className="h-4 w-4" />
        </IconButton>
        <IconButton label="Export chat">
          <Download className="h-4 w-4" />
        </IconButton>
        <IconButton label="Branch chat" onClick={onBranch}>
          <GitBranch className="h-4 w-4" />
        </IconButton>
        <FullScreenToggle page="playground" />
        <IconButton label="More chat actions">
          <MoreHorizontal className="h-4 w-4" />
        </IconButton>
      </div>
    </header>
  );
}
