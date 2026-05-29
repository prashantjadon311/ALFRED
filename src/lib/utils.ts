import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { AgentStatus, ProjectStatus, Severity, WorkflowStatus } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value > 100 ? 0 : 2
  }).format(value);
}

export function formatTokens(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
}

export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export function statusTone(status: AgentStatus | ProjectStatus | WorkflowStatus | Severity | string) {
  switch (status) {
    case "Success":
    case "Completed":
    case "Active":
    case "Healthy":
    case "Fixed":
    case "Low":
    case "Enabled":
    case "Indexed":
    case "Stable":
      return "border-success/30 bg-success/10 text-success";
    case "Running":
    case "Planning":
    case "Medium":
      return "border-primary/30 bg-primary/10 text-primary-soft dark:text-indigo-200";
    case "Waiting":
    case "Waiting Approval":
    case "Needs Approval":
    case "High":
    case "Watch":
      return "border-warning/30 bg-warning/10 text-warning";
    case "Failed":
    case "Offline":
    case "Blocker":
    case "Drift Detected":
      return "border-danger/30 bg-danger/10 text-danger";
    case "Paused":
    case "Degraded":
    case "Disabled":
      return "border-slate-400/30 bg-slate-500/10 text-slate-300";
    default:
      return "border-surface-darkBorder bg-surface-darkElevated text-slate-300";
  }
}

export function providerAccent(provider: string) {
  if (provider.includes("OpenAI")) return "from-emerald-400/20 to-cyan-400/10";
  if (provider.includes("Gemini") || provider.includes("Google")) return "from-sky-400/20 to-primary/10";
  if (provider.includes("Claude") || provider.includes("Anthropic")) return "from-orange-400/20 to-rose-400/10";
  if (provider.includes("Ollama") || provider.includes("Local")) return "from-lime-400/20 to-teal-400/10";
  return "from-primary/20 to-violet-400/10";
}

export function contentLooksLikeArtifact(content: string) {
  return content.length > 500 || /```|<html|<svg|^\s*\{[\s\S]*\}\s*$/m.test(content);
}

export function percent(used: number, limit: number) {
  return Math.min(100, Math.round((used / limit) * 100));
}
