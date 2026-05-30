"use client";

import { Download, MessageSquarePlus, PanelRightClose, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/shared/Button";
import { EmptyState } from "@/components/shared/EmptyState";
import type { Message } from "@/lib/types";
import { useChatStore } from "@/store/chat-store";
import { ChatComposer } from "./ChatComposer";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";

export function ChatWorkspace({ chatId, onOpenConversations }: { chatId: string; onOpenConversations?: () => void }) {
  const chats = useChatStore((state) => state.chats);
  const branchChat = useChatStore((state) => state.branchChat);
  const createChat = useChatStore((state) => state.createChat);
  const loadMessagesForChat = useChatStore((state) => state.loadMessagesForChat);
  const [artifact, setArtifact] = useState<Message | null>(null);
  const chat = useMemo(() => chats.find((item) => item.id === chatId) ?? chats[0], [chatId, chats]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setArtifact(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (chat?.id) void loadMessagesForChat(chat.id);
  }, [chat?.id, loadMessagesForChat]);

  if (!chat) {
    return (
      <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-surface-dark/35">
        <div className="grid flex-1 place-items-center p-6">
          <EmptyState
            title="No chat sessions"
            description="Create a mocked A.L.F.R.E.D. session to start designing, comparing, or critiquing."
            action={<Button variant="primary" icon={<MessageSquarePlus className="h-4 w-4" />} onClick={() => createChat("New agent session")}>New chat</Button>}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-surface-dark/30">
      <ChatHeader chat={chat} onOpenConversations={onOpenConversations} onBranch={() => branchChat(chat.id)} />
      <ChatMessages chat={chat} onBranch={(messageId) => branchChat(chat.id, messageId)} onOpenArtifact={setArtifact} />
      <ChatComposer chatId={chat.id} />

      {artifact ? (
        <aside
          className="fixed bottom-0 right-0 top-0 z-[100] w-full border-l border-surface-darkBorder bg-surface-dark/95 shadow-glow backdrop-blur-xl transition-transform duration-200 lg:w-[45vw]"
          role="dialog"
          aria-modal="true"
          aria-label="Artifact drawer"
        >
            <div className="absolute left-0 top-0 h-full w-1 cursor-col-resize bg-primary/35" />
            <div className="flex h-14 items-center justify-between border-b border-surface-darkBorder px-5">
              <div>
                <h3 className="font-semibold text-white">Artifact</h3>
                <p className="text-xs text-muted">Preview · Code · Diff</p>
              </div>
              <div className="flex gap-2">
                <Button size="icon" variant="ghost" aria-label="Export artifact">
                  <Download className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" aria-label="Close artifact drawer" onClick={() => setArtifact(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex border-b border-surface-darkBorder px-5 py-2 text-sm">
              {["Preview", "Code", "Diff"].map((tab, index) => (
                <button key={tab} className={`rounded-button px-3 py-1.5 transition hover:bg-primary/10 ${index === 0 ? "bg-primary text-white shadow-glow" : "text-muted hover:text-white"}`}>
                  {tab}
                </button>
              ))}
            </div>
            <div className="custom-scrollbar h-[calc(100%-7rem)] overflow-y-auto p-4 pb-24 sm:p-5">
              <pre className="whitespace-pre-wrap rounded-card border border-surface-darkBorder p-4 text-sm leading-6 text-slate-200" style={{ background: "var(--code-bg)", color: "var(--code-text)" }}>
                {artifact.content}
              </pre>
            </div>
            <Button className="absolute bottom-4 right-4" variant="secondary" icon={<PanelRightClose className="h-4 w-4" />} onClick={() => setArtifact(null)}>
              Close drawer
            </Button>
        </aside>
      ) : null}
    </section>
  );
}
