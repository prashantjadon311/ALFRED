"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { detectLanguage } from "@/lib/markdown";

const CodeBlockHighlighter = dynamic(() => import("./CodeBlockHighlighter").then((mod) => mod.CodeBlockHighlighter), {
  ssr: false,
  loading: () => (
    <pre className="overflow-x-auto p-4 text-sm text-slate-300">
      <code>Loading code...</code>
    </pre>
  )
});

function CodeFallback({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto p-4 text-sm text-slate-300">
      <code>{code}</code>
    </pre>
  );
}

type CodeRendererProps = {
  inline?: boolean;
  className?: string;
  children?: ReactNode;
};

export function MarkdownMessageContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        code({ inline, className, children, ...props }: CodeRendererProps) {
          const language = detectLanguage(className);
          const code = String(children ?? "").replace(/\n$/, "");
          if (inline) {
            return (
              <code className="rounded bg-black/25 px-1.5 py-0.5 text-primary-soft" {...props}>
                {children}
              </code>
            );
          }
          return (
            <div className="my-4 overflow-hidden rounded-card border border-surface-darkBorder" style={{ background: "var(--code-bg)" }}>
              <div className="flex items-center justify-between border-b border-surface-darkBorder px-3 py-2">
                <span className="text-xs font-semibold uppercase text-muted">{language}</span>
                <button className="rounded-button px-2 py-1 text-xs text-slate-300 transition hover:bg-white/7 hover:text-white" onClick={() => navigator.clipboard?.writeText(code)}>
                  Copy code
                </button>
              </div>
              {code ? <CodeBlockHighlighter code={code} language={language} /> : <CodeFallback code={code} />}
            </div>
          );
        }
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
