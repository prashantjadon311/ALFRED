"use client";

import { motion } from "framer-motion";
import { Copy, Download, GitBranch, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ArtifactOpenButton } from "@/components/playground/ArtifactOpenButton";
import { Button } from "@/components/shared/Button";
import { detectLanguage } from "@/lib/markdown";
import type { Message } from "@/lib/types";
import { cn, contentLooksLikeArtifact } from "@/lib/utils";
import { TokenFooter } from "./TokenFooter";

export function MessageBubble({
  message,
  onBranch,
  onOpenArtifact
}: {
  message: Message;
  onBranch?: (messageId: string) => void;
  onOpenArtifact?: (message: Message) => void;
}) {
  const isUser = message.role === "user";

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("group flex gap-3", isUser && "justify-end")}
      aria-live={message.role === "assistant" ? "polite" : undefined}
    >
      {!isUser ? (
        <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/85 text-xs font-semibold text-white shadow-glow">AI</div>
      ) : null}
      <div className={cn("max-w-[min(100%,900px)] rounded-[18px] border px-4 py-3 transition hover:border-primary/25", isUser ? "border-primary/25 bg-primary/14" : "border-surface-darkBorder/80 bg-surface-darkCard/68")}>
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">{isUser ? "Prashant" : message.model}</p>
            <p className="text-xs text-muted">{message.role === "assistant" ? "Governed response" : "User prompt"}</p>
          </div>
          <div className="flex opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            <Button size="icon" variant="ghost" aria-label="Copy message" onClick={() => navigator.clipboard?.writeText(message.content)}>
              <Copy className="h-4 w-4" />
            </Button>
            {!isUser ? (
              <>
                <Button size="icon" variant="ghost" aria-label="Regenerate response">
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" aria-label="Branch from here" onClick={() => onBranch?.(message.id)}>
                  <GitBranch className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" aria-label="Export message">
                  <Download className="h-4 w-4" />
                </Button>
              </>
            ) : null}
          </div>
        </div>

        <div className="prose max-w-none text-sm leading-7">
          <ReactMarkdown
            components={{
              code({ inline, className, children, ...props }: any) {
                const language = detectLanguage(className);
                const code = String(children).replace(/\n$/, "");
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
                    <SyntaxHighlighter language={language} style={oneDark} showLineNumbers customStyle={{ margin: 0, background: "transparent", fontSize: 13, color: "var(--code-text)", overflowX: "auto" }}>
                      {code}
                    </SyntaxHighlighter>
                  </div>
                );
              }
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {contentLooksLikeArtifact(message.content) ? <ArtifactOpenButton onClick={() => onOpenArtifact?.(message)} /> : null}

        <TokenFooter message={message} />
      </div>
    </motion.article>
  );
}
