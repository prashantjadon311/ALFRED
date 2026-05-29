"use client";

import { SegmentedControl } from "@/components/shared/SegmentedControl";

export type ConversationTab = "Chats" | "Projects";

export function ConversationTabs({ value, onChange }: { value: ConversationTab; onChange: (value: ConversationTab) => void }) {
  return (
    <SegmentedControl
      ariaLabel="Conversation sidebar view"
      options={["Chats", "Projects"] as const}
      value={value}
      onChange={onChange}
      className="grid h-9 w-full grid-cols-2"
      optionClassName="h-8"
    />
  );
}
