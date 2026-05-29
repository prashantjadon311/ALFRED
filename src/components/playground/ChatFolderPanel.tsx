"use client";

import { Download, Folder, FolderInput, GitBranch, MessageSquare, MessageSquarePlus, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/shared/Button";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchInput } from "@/components/shared/SearchInput";
import type { Chat } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import { useChatStore } from "@/store/chat-store";
import { useSettingsStore } from "@/store/settings-store";
import { MoveChatToFolderDialog } from "./MoveChatToFolderDialog";

function exportChat(chat: Chat) {
  const payload = JSON.stringify(chat, null, 2);
  navigator.clipboard?.writeText(payload);
}

export function ChatFolderPanel({
  activeChatId,
  onSelect,
  onCreate
}: {
  activeChatId: string;
  onSelect: (chatId: string) => void;
  onCreate: (folderId?: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [openMenuChatId, setOpenMenuChatId] = useState<string | null>(null);
  const [movingChat, setMovingChat] = useState<Chat | null>(null);
  const chats = useChatStore((state) => state.chats);
  const folders = useChatStore((state) => state.folders);
  const createFolder = useChatStore((state) => state.createFolder);
  const renameFolder = useChatStore((state) => state.renameFolder);
  const deleteFolder = useChatStore((state) => state.deleteFolder);
  const branchChat = useChatStore((state) => state.branchChat);
  const deleteChat = useChatStore((state) => state.deleteChat);
  const renameChat = useChatStore((state) => state.renameChat);
  const settings = useSettingsStore();

  const filteredChats = useMemo(
    () => chats.filter((chat) => `${chat.title} ${chat.model}`.toLowerCase().includes(query.toLowerCase())),
    [chats, query]
  );
  const noFolderChats = filteredChats.filter((chat) => !chat.folderId);

  const addFolder = () => {
    const name = window.prompt("Folder name");
    if (name) createFolder(name);
  };

  const rename = (folderId: string, currentName: string) => {
    const name = window.prompt("Rename folder", currentName);
    if (name) renameFolder(folderId, name);
  };

  const renderChat = (chat: Chat) => (
    <div key={chat.id} className="relative">
      <button
        className={cn(
          "flex w-full items-start gap-2 rounded-button px-2 py-2 text-left text-sm text-slate-300 transition hover:bg-white/10 hover:text-white",
          activeChatId === chat.id && "bg-primary/15 text-white"
        )}
        onClick={() => onSelect(chat.id)}
        type="button"
      >
        <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2">{chat.title}</span>
          <span className="mt-1 block truncate text-[11px] text-muted">
            {chat.model} · {formatDate(chat.updatedAt)}
          </span>
        </span>
      </button>
      <Button
        size="icon"
        variant="ghost"
        className="absolute right-1 top-1 h-7 w-7"
        aria-label={`Open ${chat.title} menu`}
        onClick={(event) => {
          event.stopPropagation();
          setOpenMenuChatId(openMenuChatId === chat.id ? null : chat.id);
        }}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {openMenuChatId === chat.id ? (
        <div className="absolute right-1 top-9 z-20 w-44 overflow-hidden rounded-card border border-surface-darkBorder bg-surface-darkElevated shadow-glow">
          <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/7 hover:text-white" type="button" onClick={() => { const title = window.prompt("Rename chat", chat.title); if (title) renameChat(chat.id, title); setOpenMenuChatId(null); }}>
            <Pencil className="h-3.5 w-3.5" /> Rename
          </button>
          <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/7 hover:text-white" type="button" onClick={() => { setMovingChat(chat); setOpenMenuChatId(null); }}>
            <FolderInput className="h-3.5 w-3.5" /> Move to folder
          </button>
          <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/7 hover:text-white" type="button" onClick={() => { branchChat(chat.id); setOpenMenuChatId(null); }}>
            <GitBranch className="h-3.5 w-3.5" /> Branch
          </button>
          <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/7 hover:text-white" type="button" onClick={() => { exportChat(chat); setOpenMenuChatId(null); }}>
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-danger hover:bg-danger/10" type="button" onClick={() => { deleteChat(chat.id); setOpenMenuChatId(null); }}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      ) : null}
    </div>
  );

  return (
    <aside className="glass-panel hidden h-full min-h-0 w-[21rem] shrink-0 flex-col rounded-panel p-3 lg:flex">
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Button className="w-full" variant="primary" icon={<MessageSquarePlus className="h-4 w-4" />} onClick={() => onCreate()}>
          New Chat
        </Button>
        <Button size="icon" variant="secondary" aria-label="New folder" title="New Folder" onClick={addFolder}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <SearchInput className="mt-3" value={query} onChange={setQuery} placeholder="Search chats" />

      <div className="custom-scrollbar mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
        {!filteredChats.length ? <EmptyState title="No chats found" description="Create a session or adjust the search." /> : null}
        <div className="space-y-4">
          {folders.map((folder) => {
            const folderChats = filteredChats.filter((chat) => chat.folderId === folder.id);
            return (
              <section key={folder.id}>
                <div className="mb-1 flex items-center gap-2 px-2">
                  <Folder className="h-3.5 w-3.5 text-primary-soft" />
                  <p className="min-w-0 flex-1 truncate text-xs font-semibold uppercase tracking-[0.14em] text-muted">{folder.name}</p>
                  <button className="text-muted transition hover:text-white" type="button" aria-label={`Rename ${folder.name}`} onClick={() => rename(folder.id, folder.name)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    className="text-muted transition hover:text-danger"
                    type="button"
                    aria-label={`Delete ${folder.name}`}
                    onClick={() => {
                      if (window.confirm(`Delete ${folder.name}? Chats will move to No Folder.`)) deleteFolder(folder.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-1">{folderChats.length ? folderChats.map(renderChat) : <p className="px-2 py-1 text-xs text-muted">No chats</p>}</div>
              </section>
            );
          })}
          {noFolderChats.length ? (
            <section>
              <div className="mb-1 flex items-center gap-2 px-2">
                <Folder className="h-3.5 w-3.5 text-muted" />
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">No Folder</p>
              </div>
              <div className="space-y-1">{noFolderChats.map(renderChat)}</div>
            </section>
          ) : null}
        </div>
      </div>

      <div className="mt-3 border-t border-surface-darkBorder pt-3">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Model Settings</p>
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs text-slate-300">Temperature {settings.globalTemperature}</span>
            <input className="w-full accent-primary" type="range" min="0" max="1" step="0.1" value={settings.globalTemperature} onChange={(event) => settings.setGlobalTemperature(Number(event.target.value))} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-300">Top P {settings.topP}</span>
            <input className="w-full accent-primary" type="range" min="0" max="1" step="0.05" value={settings.topP} onChange={(event) => settings.setTopP(Number(event.target.value))} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-300">Max tokens</span>
            <input className="h-9 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-xs text-white" value={settings.maxTokens} onChange={(event) => settings.setMaxTokens(Number(event.target.value))} />
          </label>
        </div>
      </div>

      <MoveChatToFolderDialog chat={movingChat} open={Boolean(movingChat)} onClose={() => setMovingChat(null)} />
    </aside>
  );
}
