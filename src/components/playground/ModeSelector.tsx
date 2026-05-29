"use client";

import { SegmentedControl } from "@/components/shared/SegmentedControl";

export type PlaygroundMode = "Chat" | "Compare" | "Agent";

export function ModeSelector({ value, onChange }: { value: PlaygroundMode; onChange: (value: PlaygroundMode) => void }) {
  return (
    <SegmentedControl
      ariaLabel="Playground mode"
      options={["Chat", "Compare", "Agent"] as const}
      value={value}
      onChange={onChange}
      className="h-8"
    />
  );
}
