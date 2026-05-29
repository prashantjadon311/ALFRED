"use client";

import { MessageSquarePlus, PanelLeftClose, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/shared/Button";
import { SearchInput } from "@/components/shared/SearchInput";
import { formatCurrency, formatTokens } from "@/lib/utils";
import { useChatStore } from "@/store/chat-store";
import { useModelStore } from "@/store/model-store";
import { ChatHistoryGroupedList } from "./ChatHistoryGroupedList";
import { ConversationTabs, type ConversationTab } from "./ConversationTabs";
import { ProjectChatTree } from "./ProjectChatTree";

export function ConversationSidebar({
  activeChatId,
  onSelect,
  onCreate,
  onClose
}: {
  activeChatId: string;
  onSelect: (chatId: string) => void;
  onCreate: () => void;
  onClose?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<ConversationTab>("Chats");
  const chats = useChatStore((state) => state.chats);
  const folders = useChatStore((state) => state.folders);
  const selectedModel = useModelStore((state) => state.selectedModel);

  const filteredChats = useMemo(
    () => chats.filter((chat) => `${chat.title} ${chat.model}`.toLowerCase().includes(query.toLowerCase())),
    [chats, query]
  );

  const totalTokens = filteredChats.reduce((sum, chat) => sum + chat.messages.reduce((messageSum, message) => messageSum + message.tokens, 0), 0);
  const totalCost = filteredChats.reduce((sum, chat) => sum + chat.messages.reduce((messageSum, message) => messageSum + message.cost, 0), 0);

  return (
    <aside className="flex h-full min-h-0 w-[300px] shrink-0 flex-col border-r border-surface-darkBorder/80 bg-surface-dark/58 backdrop-blur-xl">
      <div className="border-b border-surface-darkBorder p-3">
        <div className="mb-3 flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">Playground</p>
            <p className="text-xs text-muted">AI chat workspace</p>
          </div>
          {onClose ? (
            <Button size="icon" variant="ghost" className="h-8 w-8 lg:hidden" aria-label="Close conversations" onClick={onClose}>
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
        <Button className="h-9 w-full" variant="primary" icon={<MessageSquarePlus className="h-4 w-4" />} onClick={onCreate}>
          New Chat
        </Button>
        <SearchInput className="mt-3" value={query} onChange={setQuery} placeholder="Search conversations" />
        <div className="mt-3">
          <ConversationTabs value={tab} onChange={setTab} />
        </div>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-3">
        {filteredChats.length ? (
          tab === "Chats" ? (
            <ChatHistoryGroupedList chats={filteredChats} activeChatId={activeChatId} onSelect={onSelect} />
          ) : (
            <ProjectChatTree folders={folders} chats={filteredChats} activeChatId={activeChatId} onSelect={onSelect} />
          )
        ) : (
          <div className="grid h-full place-items-center px-4 text-center">
            <div>
              <Search className="mx-auto mb-3 h-5 w-5 text-muted" />
              <p className="text-sm font-semibold text-white">No conversations found</p>
              <p className="mt-1 text-xs leading-5 text-muted">Try a different title, model, or project keyword.</p>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-surface-darkBorder p-3">
        <div className="rounded-card border border-surface-darkBorder bg-surface-darkElevated/45 p-2.5">
          <p className="truncate text-xs font-medium text-white">{selectedModel}</p>
          <p className="mt-1 text-[11px] text-muted">
            {formatTokens(totalTokens)} session tokens · {formatCurrency(totalCost)}
          </p>
        </div>
      </div>
    </aside>
  );
}
