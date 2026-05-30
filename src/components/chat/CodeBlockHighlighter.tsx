"use client";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export function CodeBlockHighlighter({ code, language }: { code: string; language: string }) {
  return (
    <SyntaxHighlighter
      language={language}
      style={oneDark}
      showLineNumbers
      customStyle={{ margin: 0, background: "transparent", fontSize: 13, color: "var(--code-text)", overflowX: "auto" }}
    >
      {code}
    </SyntaxHighlighter>
  );
}
