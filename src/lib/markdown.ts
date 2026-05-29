export function detectLanguage(className?: string) {
  const match = /language-(\w+)/.exec(className || "");
  return match?.[1] || "text";
}
