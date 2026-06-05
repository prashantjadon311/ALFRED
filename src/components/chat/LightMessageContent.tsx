"use client";

import dynamic from "next/dynamic";

const MarkdownMessageContent = dynamic(() => import("./MarkdownMessageContent").then((mod) => mod.MarkdownMessageContent), {
  ssr: false,
  loading: () => <div className="h-16 animate-pulse rounded-card bg-white/5" />
});

const markdownPattern = /```[\s\S]*?```|(^|\n)\s{0,3}(#{1,6}\s|>\s|[-*+]\s|\d+\.\s|\|.+\|)|\*\*[^*]+\*\*|__[^_]+__|`[^`\n]+`|\[[^\]]+\]\([^)]+\)/;

function needsMarkdown(content: string) {
  return markdownPattern.test(content);
}

export function LightMessageContent({ content, role }: { content: string; role: "user" | "assistant" | "system" }) {
  if (role === "user" || !needsMarkdown(content)) {
    return <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200">{content}</p>;
  }

  return <MarkdownMessageContent content={content} />;
}
