"use client";

import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { EmptyState } from "@/components/shared/EmptyState";
import type { Chat, Message } from "@/lib/types";
import { MessageBubble } from "@/components/chat/MessageBubble";

export function ChatMessages({
  chat,
  onBranch,
  onOpenArtifact
}: {
  chat: Chat;
  onBranch: (messageId: string) => void;
  onOpenArtifact: (message: Message) => void;
}) {
  return (
    <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-6">
      <div className="mx-auto flex max-w-[900px] flex-col gap-5">
        {chat.messages.length ? (
          chat.messages.map((message) => (
            <MessageBubble key={message.id} message={message} onBranch={onBranch} onOpenArtifact={onOpenArtifact} />
          ))
        ) : (
          <div className="grid min-h-[45vh] place-items-center">
            <EmptyState
              title="Start an A.L.F.R.E.D. session"
              description="Ask a focused question, compare models, or use Agent Actions from the composer."
              action={<Button variant="primary" icon={<MessageSquarePlus className="h-4 w-4" />}>Use composer below</Button>}
            />
          </div>
        )}
      </div>
    </div>
  );
}
