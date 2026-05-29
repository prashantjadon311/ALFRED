"use client";

import { Bot, BrainCircuit, GitPullRequestArrow, LockKeyhole, Network, WandSparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { PopoverMenu } from "@/components/shared/PopoverMenu";
import { useChatStore } from "@/store/chat-store";

const actions = [
  { label: "Lock Requirement", icon: LockKeyhole, message: "Requirement lock drafted locally. A.L.F.R.E.D. will preserve the original motive before agent execution." },
  { label: "Compare Models", icon: BrainCircuit, message: "Compare mode prepared with GPT-5, Claude Opus, and Gemini architecture perspectives." },
  { label: "Run Claude Critique", icon: Bot, message: "Claude critic mock pass queued. It will inspect drift, blockers, and missing acceptance criteria." },
  { label: "Generate Codex Prompt", icon: WandSparkles, message: "Codex prompt bundle mock generation prepared with phased implementation prompts." },
  { label: "Start Agentic Workflow", icon: GitPullRequestArrow, message: "Agentic workflow mock start queued: requirement lock → designers → critic → resolver → artifact." },
  { label: "Open Agent Studio", icon: Network, href: "/agent-studio" }
] as const;

export function AgentActionsDropdown({ chatId, compact = false }: { chatId: string; compact?: boolean }) {
  const router = useRouter();
  const appendMessage = useChatStore((state) => state.appendMessage);

  const runAction = (action: (typeof actions)[number]) => {
    if ("href" in action) {
      router.push(action.href);
      return;
    }
    appendMessage(chatId, {
      role: "assistant",
      model: "A.L.F.R.E.D. Action Router",
      tokens: 96,
      cost: 0,
      latency: 0.2,
      content: `**${action.label}**\n\n${action.message}`
    });
  };

  return (
    <PopoverMenu
      ariaLabel="Open agent actions"
      align="left"
      placement="top"
      panelClassName="w-64"
      trigger={(open) => (
        <span className={`inline-flex h-8 items-center gap-2 rounded-button border border-surface-darkBorder px-2.5 text-xs font-medium transition ${open ? "bg-primary text-white" : "bg-surface-darkElevated/70 text-slate-200 hover:border-primary/40 hover:text-white"}`}>
          <Bot className="h-3.5 w-3.5" />
          {compact ? "Actions" : "Agent Actions"}
        </span>
      )}
      triggerClassName="inline-flex w-auto"
    >
      {(close) => (
        <div className="space-y-1">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                className="flex w-full items-center gap-2 rounded-button px-2.5 py-2 text-left text-sm text-slate-300 transition hover:bg-white/7 hover:text-white"
                onClick={() => {
                  runAction(action);
                  close();
                }}
              >
                <Icon className="h-4 w-4 text-primary-soft" />
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </PopoverMenu>
  );
}
