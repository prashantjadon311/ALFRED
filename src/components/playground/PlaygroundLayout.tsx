"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/chat-store";
import { useUiStore } from "@/store/ui-store";
import { ChatWorkspace } from "./ChatWorkspace";
import { ConversationSidebar } from "./ConversationSidebar";

export function PlaygroundLayout() {
  const activeChatId = useChatStore((state) => state.activeChatId);
  const setActiveChatId = useChatStore((state) => state.setActiveChatId);
  const createChat = useChatStore((state) => state.createChat);
  const fullScreenPage = useUiStore((state) => state.fullScreenPage);
  const fullScreen = fullScreenPage === "playground";
  const [conversationOpen, setConversationOpen] = useState(false);

  const create = () => {
    createChat("New agent session");
    setConversationOpen(false);
  };

  const selectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setConversationOpen(false);
  };

  return (
    <div
      className={cn(
        "min-h-0 overflow-hidden rounded-panel border border-surface-darkBorder/70 bg-surface-dark/45",
        fullScreen
          ? "fixed inset-0 z-50 h-dvh bg-surface-dark/95 p-3 backdrop-blur-xl"
          : "h-[calc(100dvh-3.5rem)] rounded-none border-x-0 border-b-0 md:h-dvh md:rounded-none md:border-0"
      )}
    >
      <div className="flex h-full min-h-0">
        <div className="hidden lg:flex">
          <ConversationSidebar activeChatId={activeChatId} onSelect={selectChat} onCreate={create} />
        </div>
        <ChatWorkspace chatId={activeChatId} onOpenConversations={() => setConversationOpen(true)} />
      </div>

      <AnimatePresence>
        {conversationOpen ? (
          <motion.div className="fixed inset-0 z-[90] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="absolute inset-0 bg-black/55 backdrop-blur-sm" aria-label="Close conversations" onClick={() => setConversationOpen(false)} />
            <motion.div
              className="relative z-[100] h-full w-[min(88vw,320px)] overflow-hidden border-r border-surface-darkBorder bg-surface-dark/96 shadow-glow"
              initial={{ x: -330 }}
              animate={{ x: 0 }}
              exit={{ x: -330 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
            >
              <ConversationSidebar activeChatId={activeChatId} onSelect={selectChat} onCreate={create} onClose={() => setConversationOpen(false)} />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
