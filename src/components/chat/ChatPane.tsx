"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Download, MessageSquarePlus, PanelRightClose, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FullScreenToggle } from "@/components/shared/FullScreenToggle";
import { Button } from "@/components/shared/Button";
import { EmptyState } from "@/components/shared/EmptyState";
import { useChatStore } from "@/store/chat-store";
import type { Message } from "@/lib/types";
import { ChatComposer } from "./ChatComposer";
import { MessageBubble } from "./MessageBubble";

export function ChatPane({ chatId }: { chatId: string }) {
  const chats = useChatStore((state) => state.chats);
  const branchChat = useChatStore((state) => state.branchChat);
  const setActiveChatId = useChatStore((state) => state.setActiveChatId);
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
      <section className="glass-panel flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-panel">
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
    <section className="glass-panel flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-panel">
      <div className="border-b border-surface-darkBorder px-4 py-3 md:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-white">{chat.title}</h2>
            <p className="text-xs text-muted">{chat.model} · {chat.messages.length} messages</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              className="h-9 min-w-0 rounded-button border border-surface-darkBorder bg-surface-darkElevated px-2 text-xs text-slate-100 lg:hidden"
              value={chat.id}
              onChange={(event) => setActiveChatId(event.target.value)}
              aria-label="Select chat"
            >
              {chats.map((item) => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </select>
            <Button className="lg:hidden" size="sm" variant="secondary" onClick={() => createChat("New agent session")}>
              New chat
            </Button>
            <FullScreenToggle page="playground" />
          </div>
        </div>
      </div>
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          {chat?.messages.length ? (
            chat.messages.map((message) => (
              <MessageBubble key={message.id} message={message} onBranch={(messageId) => branchChat(chat.id, messageId)} onOpenArtifact={setArtifact} />
            ))
          ) : (
            <EmptyState
              title="Start an agentic session"
              description="Ask for a design pass, model comparison, Claude critique, or a requirement-locked workflow run."
              action={<Button variant="primary" icon={<MessageSquarePlus className="h-4 w-4" />}>Use composer below</Button>}
            />
          )}
        </div>
      </div>
      <ChatComposer chatId={chat.id} />

      <AnimatePresence>
        {artifact ? (
          <motion.aside
            className="fixed bottom-0 right-0 top-0 z-[100] w-full border-l border-surface-darkBorder bg-surface-dark/95 shadow-glow backdrop-blur-xl lg:w-[45vw]"
            role="dialog"
            aria-modal="true"
            aria-label="Artifact drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 220, damping: 26 }}
          >
            <div className="absolute left-0 top-0 h-full w-1 cursor-col-resize bg-primary/35" />
            <div className="flex h-16 items-center justify-between border-b border-surface-darkBorder px-5">
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
            <div className="flex border-b border-surface-darkBorder px-5 py-3 text-sm">
              {["Preview", "Code", "Diff"].map((tab, index) => (
                <button key={tab} className={`rounded-button px-3 py-1.5 transition hover:bg-primary/10 ${index === 0 ? "bg-primary text-white shadow-glow" : "text-muted hover:text-white"}`}>
                  {tab}
                </button>
              ))}
            </div>
            <div className="custom-scrollbar h-[calc(100%-7.75rem)] overflow-y-auto p-4 pb-24 sm:p-5">
              <pre className="whitespace-pre-wrap rounded-card border border-surface-darkBorder p-4 text-sm leading-6 text-slate-200" style={{ background: "var(--code-bg)", color: "var(--code-text)" }}>
                {artifact.content}
              </pre>
            </div>
            <Button className="absolute bottom-4 right-4" variant="secondary" icon={<PanelRightClose className="h-4 w-4" />} onClick={() => setArtifact(null)}>
              Close drawer
            </Button>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
