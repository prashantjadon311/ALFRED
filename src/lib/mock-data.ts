import type {
  AgentNode,
  Artifact,
  BudgetRule,
  Chat,
  ChatFolder,
  CritiqueIssue,
  ModelConfig,
  ModelProvider,
  Project,
  ProjectTask,
  PromptItem,
  RequirementContract,
  UsagePoint,
  Workspace,
  WorkflowRun
} from "./types";

export const projects: Project[] = [
  {
    id: "alfred-platform",
    name: "A.L.F.R.E.D. Platform",
    description: "Agentic AI command center for orchestrating multi-model execution loops.",
    type: "Software",
    status: "Active",
    progress: 68,
    createdAt: "2026-04-12T10:20:00Z",
    updatedAt: "2026-05-21T13:15:00Z",
    tokenUsage: 1_482_900,
    cost: 312.42,
    activeWorkflowId: "wf-active-001"
  },
  {
    id: "vapt-flow-builder",
    name: "VAPT Action Flow Builder",
    description: "Workflow generator for audit findings, remediation routing, and approval checkpoints.",
    type: "Mixed",
    status: "Waiting Approval",
    progress: 46,
    createdAt: "2026-04-18T09:00:00Z",
    updatedAt: "2026-05-20T18:36:00Z",
    tokenUsage: 642_220,
    cost: 122.35,
    activeWorkflowId: "wf-003"
  },
  {
    id: "ai-research-assistant",
    name: "AI Research Assistant",
    description: "Structured literature triage, claim tracking, and synthesis memos.",
    type: "Research",
    status: "Planning",
    progress: 29,
    createdAt: "2026-05-02T07:30:00Z",
    updatedAt: "2026-05-19T12:00:00Z",
    tokenUsage: 391_800,
    cost: 74.08,
    activeWorkflowId: "wf-004"
  },
  {
    id: "legacy-migration-planner",
    name: "Legacy Migration Planner",
    description: "Agentic assessment plan for service decomposition, risk mapping, and code prompt packs.",
    type: "Planning",
    status: "Paused",
    progress: 57,
    createdAt: "2026-03-29T11:40:00Z",
    updatedAt: "2026-05-15T16:42:00Z",
    tokenUsage: 818_000,
    cost: 158.93,
    activeWorkflowId: "wf-005"
  },
  {
    id: "prompt-engineering-library",
    name: "Prompt Engineering Library",
    description: "Role-specific prompt templates for product, architecture, audit, and Codex execution.",
    type: "Software",
    status: "Completed",
    progress: 100,
    createdAt: "2026-02-10T08:25:00Z",
    updatedAt: "2026-05-08T15:11:00Z",
    tokenUsage: 524_430,
    cost: 81.77
  }
];

export const requirementContract: RequirementContract = {
  id: "req-alfred-001",
  originalRequirement:
    "Build a frontend-only prototype for A.L.F.R.E.D., an agentic AI platform that combines AI playgrounds, workflow orchestration, project execution, model configuration, and cost governance.",
  lockedGoal:
    "Deliver a premium dark-mode Next.js prototype that clearly communicates agentic AI workflow control, model comparison, project execution, and token/cost governance using mocked data only.",
  nonNegotiables: [
    "No real backend, auth, payment, database, API key execution, or LLM calls.",
    "Requirement lock and Claude critic loop must be visually prominent.",
    "Every provider key must be masked and fake.",
    "Project, workflow, model, usage, library, and settings pages must exist."
  ],
  successCriteria: [
    "App builds without TypeScript errors.",
    "Agent Studio shows a full multi-agent workflow graph.",
    "Dashboard, playground, and project detail feel AI-native rather than generic.",
    "Mock services and stores keep backend integration straightforward."
  ],
  outOfScope: ["Nest.js backend", "Supabase", "live streaming", "real model calls", "billing execution"],
  driftStatus: "Stable",
  locked: true
};

export const agentNodes: AgentNode[] = [
  {
    id: "user-requirement",
    title: "User Requirement",
    provider: "Workspace",
    model: "Human Input",
    role: "Captures the raw request and project motive.",
    status: "Success",
    inputTokens: 4100,
    outputTokens: 800,
    cost: 0,
    latency: 0.2,
    systemPrompt: "Preserve the user's original motive and record constraints before synthesis begins."
  },
  {
    id: "requirement-lock",
    title: "Requirement Lock",
    provider: "A.L.F.R.E.D.",
    model: "Contract Engine",
    role: "Creates a signed execution contract and drift guardrails.",
    status: "Success",
    inputTokens: 5200,
    outputTokens: 1600,
    cost: 0.18,
    latency: 1.4,
    systemPrompt: "Extract non-negotiables, success criteria, exclusions, and acceptance checks."
  },
  {
    id: "chatgpt-designer",
    title: "ChatGPT Designer",
    provider: "OpenAI",
    model: "GPT-5",
    role: "Designs interaction flows, component hierarchy, and AI-native UX.",
    status: "Success",
    inputTokens: 18200,
    outputTokens: 6300,
    cost: 1.86,
    latency: 6.4,
    systemPrompt: "Act as a senior AI product designer. Produce high-signal UI architecture."
  },
  {
    id: "gemini-architect",
    title: "Gemini Architect",
    provider: "Google Gemini",
    model: "Gemini 2.5 Pro",
    role: "Checks information architecture, data boundaries, and scalability.",
    status: "Running",
    inputTokens: 16800,
    outputTokens: 4100,
    cost: 1.22,
    latency: 5.8,
    systemPrompt: "Evaluate the implementation architecture and integration seams for future Nest.js APIs."
  },
  {
    id: "consensus-builder",
    title: "Consensus Builder",
    provider: "A.L.F.R.E.D.",
    model: "Synthesis Router",
    role: "Merges model recommendations into a single execution plan.",
    status: "Pending",
    inputTokens: 0,
    outputTokens: 0,
    cost: 0,
    latency: 0,
    systemPrompt: "Resolve disagreements and output the narrowest plan that satisfies the contract."
  },
  {
    id: "claude-critic",
    title: "Claude Critic",
    provider: "Anthropic Claude",
    model: "Claude Opus",
    role: "Audits for requirement drift, UX gaps, and hidden implementation risks.",
    status: "Pending",
    inputTokens: 0,
    outputTokens: 0,
    cost: 0,
    latency: 0,
    systemPrompt: "Be strict. Identify blockers, risks, and missing acceptance criteria."
  },
  {
    id: "issue-resolver",
    title: "Issue Resolver",
    provider: "OpenAI",
    model: "GPT-5",
    role: "Resolves critic findings and produces patch-ready changes.",
    status: "Pending",
    inputTokens: 0,
    outputTokens: 0,
    cost: 0,
    latency: 0,
    systemPrompt: "Turn critique findings into concrete UI and code fixes."
  },
  {
    id: "budget-manager",
    title: "Budget Manager",
    provider: "A.L.F.R.E.D.",
    model: "Governance Runtime",
    role: "Monitors spend, thresholds, and stop conditions.",
    status: "Waiting",
    inputTokens: 2400,
    outputTokens: 300,
    cost: 0.04,
    latency: 0.8,
    systemPrompt: "Pause when workflow spend exceeds configured limits or approval thresholds."
  },
  {
    id: "human-approval",
    title: "Human Approval",
    provider: "Workspace",
    model: "Prashant",
    role: "Approves final direction before artifact generation.",
    status: "Needs Approval",
    inputTokens: 0,
    outputTokens: 0,
    cost: 0,
    latency: 0,
    systemPrompt: "Present critical decisions with clear approve, revise, or pause choices."
  },
  {
    id: "final-output",
    title: "Final Output",
    provider: "A.L.F.R.E.D.",
    model: "Artifact Composer",
    role: "Produces the final product spec and execution summary.",
    status: "Pending",
    inputTokens: 0,
    outputTokens: 0,
    cost: 0,
    latency: 0,
    systemPrompt: "Generate final artifacts only after critic clearance and approval."
  },
  {
    id: "codex-prompt-generator",
    title: "Codex Prompt Generator",
    provider: "OpenAI",
    model: "Codex",
    role: "Creates implementation prompts for coding agents.",
    status: "Pending",
    inputTokens: 0,
    outputTokens: 0,
    cost: 0,
    latency: 0,
    systemPrompt: "Write direct, scoped implementation prompts with file ownership and acceptance checks."
  },
  {
    id: "export-artifact",
    title: "Export Artifact",
    provider: "A.L.F.R.E.D.",
    model: "Exporter",
    role: "Packages prompts, decisions, issues, and audit trail.",
    status: "Pending",
    inputTokens: 0,
    outputTokens: 0,
    cost: 0,
    latency: 0,
    systemPrompt: "Export markdown, JSON, and prompt bundles without exposing secrets."
  }
];

export const workflows: WorkflowRun[] = [
  {
    id: "wf-active-001",
    projectId: "alfred-platform",
    name: "Command Center Prototype Loop",
    status: "Running",
    currentNodeId: "gemini-architect",
    iteration: 3,
    maxIterations: 6,
    totalTokens: 214_900,
    totalCost: 38.74,
    startedAt: "2026-05-21T14:18:00Z",
    duration: "41m 12s",
    claudeVerdict: "No blocker yet. Watch right panel density and graph node legibility."
  },
  {
    id: "wf-002",
    projectId: "alfred-platform",
    name: "Provider Governance Audit",
    status: "Completed",
    currentNodeId: "export-artifact",
    iteration: 4,
    maxIterations: 5,
    totalTokens: 121_500,
    totalCost: 19.33,
    startedAt: "2026-05-20T12:10:00Z",
    duration: "1h 08m",
    claudeVerdict: "Approved with recommendation to surface budget stop conditions earlier."
  },
  {
    id: "wf-003",
    projectId: "vapt-flow-builder",
    name: "Finding-to-Action Flow Design",
    status: "Waiting Approval",
    currentNodeId: "human-approval",
    iteration: 2,
    maxIterations: 5,
    totalTokens: 98_240,
    totalCost: 17.95,
    startedAt: "2026-05-20T16:05:00Z",
    duration: "52m 21s",
    claudeVerdict: "Approval required because remediation ownership is ambiguous."
  },
  {
    id: "wf-004",
    projectId: "ai-research-assistant",
    name: "Research Claim Synthesis",
    status: "Paused",
    currentNodeId: "budget-manager",
    iteration: 1,
    maxIterations: 4,
    totalTokens: 76_880,
    totalCost: 12.01,
    startedAt: "2026-05-18T10:40:00Z",
    duration: "31m 44s",
    claudeVerdict: "Paused before model expansion to prevent duplicate literature summaries."
  },
  {
    id: "wf-005",
    projectId: "legacy-migration-planner",
    name: "Migration Risk Planner",
    status: "Failed",
    currentNodeId: "claude-critic",
    iteration: 5,
    maxIterations: 5,
    totalTokens: 188_100,
    totalCost: 35.62,
    startedAt: "2026-05-15T09:25:00Z",
    duration: "2h 16m",
    claudeVerdict: "Failed due to unresolved blocker: missing service inventory."
  }
];

export const providers: ModelProvider[] = [
  {
    id: "openai",
    name: "OpenAI",
    enabled: true,
    maskedApiKey: "sk-proj-••••••••••••••••8F3a",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "GPT-5",
    health: "Healthy",
    inputCost: 5,
    outputCost: 15,
    rateLimit: "12k rpm / 4M tpm"
  },
  {
    id: "gemini",
    name: "Google Gemini",
    enabled: true,
    maskedApiKey: "AIza••••••••••••••••u92K",
    baseUrl: "https://generativelanguage.googleapis.com",
    defaultModel: "Gemini 2.5 Pro",
    health: "Healthy",
    inputCost: 3.5,
    outputCost: 10.5,
    rateLimit: "8k rpm / 2M tpm"
  },
  {
    id: "claude",
    name: "Anthropic Claude",
    enabled: true,
    maskedApiKey: "sk-ant-••••••••••••••••72Qp",
    baseUrl: "https://api.anthropic.com",
    defaultModel: "Claude Opus",
    health: "Degraded",
    inputCost: 15,
    outputCost: 75,
    rateLimit: "3k rpm / 1M tpm"
  },
  {
    id: "ollama",
    name: "Local LLM/Ollama",
    enabled: true,
    maskedApiKey: "local-only",
    baseUrl: "http://localhost:11434",
    defaultModel: "llama3.1:70b",
    health: "Healthy",
    inputCost: 0,
    outputCost: 0,
    rateLimit: "local hardware"
  },
  {
    id: "custom",
    name: "Custom OpenAI-Compatible Provider",
    enabled: false,
    maskedApiKey: "sk-custom-••••••••••••••••",
    baseUrl: "https://gateway.internal/v1",
    defaultModel: "router-premium",
    health: "Offline",
    inputCost: 2,
    outputCost: 8,
    rateLimit: "configured by gateway"
  }
];

export const models: ModelConfig[] = [
  { id: "gpt-5", provider: "OpenAI", name: "GPT-5", contextWindow: 400000, inputCost: 5, outputCost: 15, defaultRole: "Designer / Resolver", enabled: true },
  { id: "gpt-5-mini", provider: "OpenAI", name: "GPT-5 Mini", contextWindow: 200000, inputCost: 0.6, outputCost: 2.4, defaultRole: "Fast Planner", enabled: true },
  { id: "claude-opus", provider: "Anthropic Claude", name: "Claude Opus", contextWindow: 200000, inputCost: 15, outputCost: 75, defaultRole: "Critic", enabled: true },
  { id: "claude-sonnet", provider: "Anthropic Claude", name: "Claude Sonnet", contextWindow: 200000, inputCost: 3, outputCost: 15, defaultRole: "Review", enabled: true },
  { id: "gemini-25-pro", provider: "Google Gemini", name: "Gemini 2.5 Pro", contextWindow: 1000000, inputCost: 3.5, outputCost: 10.5, defaultRole: "Architect", enabled: true },
  { id: "gemini-flash", provider: "Google Gemini", name: "Gemini Flash", contextWindow: 1000000, inputCost: 0.35, outputCost: 1.05, defaultRole: "Summarizer", enabled: true },
  { id: "llama-local", provider: "Local LLM/Ollama", name: "llama3.1:70b", contextWindow: 128000, inputCost: 0, outputCost: 0, defaultRole: "Private Drafting", enabled: true },
  { id: "router-premium", provider: "Custom OpenAI-Compatible Provider", name: "router-premium", contextWindow: 128000, inputCost: 2, outputCost: 8, defaultRole: "Fallback", enabled: false }
];

export const chats: Chat[] = [
  {
    id: "chat-001",
    title: "Agentic workflow platform shell",
    projectId: "alfred-platform",
    folderId: "folder-alfred",
    model: "GPT-5",
    createdAt: "2026-05-21T11:02:00Z",
    updatedAt: "2026-05-21T12:52:00Z",
    messages: [
      {
        id: "msg-001",
        role: "user",
        model: "GPT-5",
        tokens: 1280,
        cost: 0.03,
        latency: 0,
        createdAt: "2026-05-21T11:02:00Z",
        content:
          "Design a frontend command center for an agentic AI platform that can run multi-model loops, lock requirements, and govern token spend."
      },
      {
        id: "msg-002",
        role: "assistant",
        model: "GPT-5",
        tokens: 4290,
        cost: 0.18,
        latency: 4.8,
        createdAt: "2026-05-21T11:03:00Z",
        content:
          "A.L.F.R.E.D. should read as a control room, not a dashboard template. The center of gravity is the workflow graph: requirement lock first, parallel model reasoning, consensus, Claude critique, issue resolution, and human approval before final artifact export.\n\n```tsx\nconst loop = [\n  'User Input',\n  'Requirement Lock',\n  'ChatGPT Designer',\n  'Gemini Architect',\n  'Consensus Builder',\n  'Claude Critic',\n  'Final Output'\n]\n```\n\nThe UI should keep cost and tokens visible beside the creative loop so every agent action feels governable."
      },
      {
        id: "msg-003",
        role: "user",
        model: "GPT-5",
        tokens: 740,
        cost: 0.02,
        latency: 0,
        createdAt: "2026-05-21T11:08:00Z",
        content: "Make the Claude critic loop and original motive lock impossible to miss."
      },
      {
        id: "msg-004",
        role: "assistant",
        model: "GPT-5",
        tokens: 3110,
        cost: 0.14,
        latency: 3.6,
        createdAt: "2026-05-21T11:09:00Z",
        content:
          "| Surface | UI treatment |\n| --- | --- |\n| Original motive locked | High-contrast contract banner with lock icon |\n| Claude critic | Dedicated issues panel with blocker/high/medium/low lanes |\n| Drift detection | Status pill attached to the requirement contract |\n\nUse the workflow status bar to repeat the latest Claude verdict during active runs."
      }
    ]
  },
  {
    id: "chat-002",
    title: "Claude critic issue taxonomy",
    projectId: "alfred-platform",
    folderId: "folder-alfred",
    model: "Claude Opus",
    createdAt: "2026-05-21T09:40:00Z",
    updatedAt: "2026-05-21T10:18:00Z",
    parentId: "chat-001",
    messages: []
  },
  {
    id: "chat-003",
    title: "Provider cost governance",
    projectId: "alfred-platform",
    folderId: "folder-governance",
    model: "Gemini 2.5 Pro",
    createdAt: "2026-05-20T15:22:00Z",
    updatedAt: "2026-05-20T16:04:00Z",
    messages: []
  },
  {
    id: "chat-004",
    title: "React Flow node details",
    projectId: "alfred-platform",
    folderId: "folder-alfred",
    model: "GPT-5",
    createdAt: "2026-05-20T08:15:00Z",
    updatedAt: "2026-05-20T09:01:00Z",
    messages: []
  },
  {
    id: "chat-005",
    title: "VAPT workflow constraints",
    projectId: "vapt-flow-builder",
    folderId: "folder-vapt",
    model: "Claude Sonnet",
    createdAt: "2026-05-18T14:48:00Z",
    updatedAt: "2026-05-18T15:03:00Z",
    messages: []
  },
  {
    id: "chat-006",
    title: "Research assistant memory design",
    projectId: "ai-research-assistant",
    folderId: "folder-research",
    model: "Gemini Flash",
    createdAt: "2026-05-17T10:05:00Z",
    updatedAt: "2026-05-17T10:33:00Z",
    messages: []
  },
  {
    id: "chat-007",
    title: "Codex prompt pack format",
    projectId: "prompt-engineering-library",
    folderId: "folder-prompts",
    model: "GPT-5 Mini",
    createdAt: "2026-05-14T12:00:00Z",
    updatedAt: "2026-05-14T12:41:00Z",
    messages: []
  },
  {
    id: "chat-008",
    title: "Local LLM fallback rules",
    projectId: "alfred-platform",
    folderId: "folder-governance",
    model: "llama3.1:70b",
    createdAt: "2026-05-11T09:13:00Z",
    updatedAt: "2026-05-11T09:44:00Z",
    messages: []
  },
  {
    id: "chat-009",
    title: "Migration planner risk model",
    projectId: "legacy-migration-planner",
    model: "Claude Opus",
    createdAt: "2026-05-06T16:25:00Z",
    updatedAt: "2026-05-06T17:20:00Z",
    messages: []
  },
  {
    id: "chat-010",
    title: "Prompt library categorization",
    projectId: "prompt-engineering-library",
    folderId: "folder-prompts",
    model: "GPT-5",
    createdAt: "2026-05-01T11:30:00Z",
    updatedAt: "2026-05-01T12:05:00Z",
    messages: []
  }
];

export const chatFolders: ChatFolder[] = [
  {
    id: "folder-alfred",
    name: "A.L.F.R.E.D. Platform",
    projectId: "alfred-platform",
    createdAt: "2026-05-18T09:00:00Z",
    updatedAt: "2026-05-21T12:52:00Z"
  },
  {
    id: "folder-governance",
    name: "Model Governance",
    projectId: "alfred-platform",
    createdAt: "2026-05-19T09:00:00Z",
    updatedAt: "2026-05-20T16:04:00Z"
  },
  {
    id: "folder-vapt",
    name: "VAPT Builder",
    projectId: "vapt-flow-builder",
    createdAt: "2026-05-17T09:00:00Z",
    updatedAt: "2026-05-18T15:03:00Z"
  },
  {
    id: "folder-research",
    name: "Research Assistant",
    projectId: "ai-research-assistant",
    createdAt: "2026-05-16T09:00:00Z",
    updatedAt: "2026-05-17T10:33:00Z"
  },
  {
    id: "folder-prompts",
    name: "Prompt Packs",
    projectId: "prompt-engineering-library",
    createdAt: "2026-05-10T09:00:00Z",
    updatedAt: "2026-05-14T12:41:00Z"
  }
];

export const workspaces: Workspace[] = [
  {
    id: "workspace-core",
    name: "Prashant / Pro Workspace",
    description: "Primary A.L.F.R.E.D. command workspace for agentic product and implementation loops.",
    active: true,
    createdAt: "2026-04-01T08:00:00Z",
    updatedAt: "2026-05-21T14:00:00Z",
    stats: {
      projects: 5,
      chats: 10,
      workflowRuns: 5,
      tokenUsage: 3_859_350,
      cost: 749.55,
      activeAgents: 7
    }
  },
  {
    id: "workspace-research",
    name: "A.L.F.R.E.D. Lab",
    description: "Sandbox for literature synthesis, model comparisons, and evidence review.",
    active: false,
    createdAt: "2026-04-20T08:00:00Z",
    updatedAt: "2026-05-19T11:15:00Z",
    stats: {
      projects: 2,
      chats: 14,
      workflowRuns: 3,
      tokenUsage: 812_400,
      cost: 128.32,
      activeAgents: 3
    }
  },
  {
    id: "workspace-audit",
    name: "Personal Research",
    description: "Private research, planning, and Claude critic quality checks.",
    active: false,
    createdAt: "2026-05-03T08:00:00Z",
    updatedAt: "2026-05-20T17:20:00Z",
    stats: {
      projects: 3,
      chats: 9,
      workflowRuns: 4,
      tokenUsage: 1_114_800,
      cost: 218.05,
      activeAgents: 5
    }
  }
];

export const projectTasks: ProjectTask[] = [
  {
    id: "task-001",
    title: "Claude critic re-audit",
    projectId: "alfred-platform",
    type: "workflow",
    status: "Running",
    owner: "Claude Critic",
    createdAt: "2026-05-21T14:18:00Z",
    updatedAt: "2026-05-21T14:49:00Z",
    progress: 68
  },
  {
    id: "task-002",
    title: "Codex prompt bundle export",
    projectId: "alfred-platform",
    type: "codex prompt",
    status: "Waiting Approval",
    owner: "Prompt Generator",
    createdAt: "2026-05-21T12:35:00Z",
    updatedAt: "2026-05-21T13:05:00Z",
    progress: 82
  },
  {
    id: "task-003",
    title: "Finding ownership checkpoint",
    projectId: "vapt-flow-builder",
    type: "approval",
    status: "Waiting Approval",
    owner: "Human Approval",
    createdAt: "2026-05-20T16:05:00Z",
    updatedAt: "2026-05-20T17:02:00Z",
    progress: 46
  },
  {
    id: "task-004",
    title: "Research claim synthesis",
    projectId: "ai-research-assistant",
    type: "artifact",
    status: "Paused",
    owner: "Budget Manager",
    createdAt: "2026-05-18T10:40:00Z",
    updatedAt: "2026-05-18T11:12:00Z",
    progress: 29
  },
  {
    id: "task-005",
    title: "Provider policy chat review",
    projectId: "alfred-platform",
    type: "chat",
    status: "Completed",
    owner: "Gemini Architect",
    createdAt: "2026-05-20T15:22:00Z",
    updatedAt: "2026-05-20T16:04:00Z",
    progress: 100
  },
  {
    id: "task-006",
    title: "Migration blocker triage",
    projectId: "legacy-migration-planner",
    type: "workflow",
    status: "Failed",
    owner: "Issue Resolver",
    createdAt: "2026-05-15T09:25:00Z",
    updatedAt: "2026-05-15T11:41:00Z",
    progress: 57
  }
];

export const critiqueIssues: CritiqueIssue[] = [
  {
    id: "issue-001",
    title: "Workflow graph density may collapse on tablet widths",
    severity: "High",
    affectedArea: "Agent Studio canvas",
    recommendation: "Keep the canvas horizontally scrollable and preserve node minimum width.",
    status: "Open"
  },
  {
    id: "issue-002",
    title: "Original motive lock needs stronger hierarchy",
    severity: "Blocker",
    affectedArea: "Project detail requirement contract",
    recommendation: "Use a dedicated lock banner above the contract body.",
    status: "Fixed"
  },
  {
    id: "issue-003",
    title: "Provider configuration must never imply live key validation",
    severity: "High",
    affectedArea: "Models page",
    recommendation: "Label test connection as mocked and keep keys masked.",
    status: "Accepted Risk"
  },
  {
    id: "issue-004",
    title: "Cost alerts need workflow-specific context",
    severity: "Medium",
    affectedArea: "Usage analytics",
    recommendation: "Add project and workflow names to each alert card.",
    status: "Open"
  }
];

export const artifacts: Artifact[] = [
  {
    id: "artifact-001",
    projectId: "alfred-platform",
    title: "Agent Loop Contract",
    type: "Spec",
    createdAt: "2026-05-21T12:35:00Z",
    content: "Requirement lock, model routing, critique loop, approval policy, and export schema."
  },
  {
    id: "artifact-002",
    projectId: "alfred-platform",
    title: "Codex Implementation Prompt",
    type: "Markdown",
    createdAt: "2026-05-21T12:52:00Z",
    content: "Build a modular frontend-only Next.js prototype for A.L.F.R.E.D. with mocked data."
  },
  {
    id: "artifact-003",
    projectId: "alfred-platform",
    title: "Workflow Graph JSON",
    type: "JSON",
    createdAt: "2026-05-20T16:48:00Z",
    content: "{\"nodes\":12,\"edges\":13,\"requiresApproval\":true}"
  }
];

export const projectMemory = [
  "A.L.F.R.E.D. is an agentic AI platform, not a trading product or generic admin panel.",
  "The strongest product signal is the requirement lock plus Claude critic loop.",
  "Future backend will be Nest.js, so services should stay frontend-only and replaceable.",
  "Model/provider configuration uses fake masked keys only.",
  "Cost governance must appear alongside playground and workflow actions."
];

export const promptLibrary: PromptItem[] = [
  {
    id: "prompt-001",
    title: "Agentic Product Designer",
    category: "Product Design",
    description: "Designs AI-native workflows with requirement lock and review loops.",
    prompt: "Act as a senior AI product designer. Map the user motive into workflow-first UX.",
    favorite: true,
    updatedAt: "2026-05-21T08:00:00Z"
  },
  {
    id: "prompt-002",
    title: "Claude Critic Strict Audit",
    category: "Agent Roles",
    description: "Finds blockers, drift, hidden risks, and missing acceptance checks.",
    prompt: "You are the final critic. Be strict, concrete, and requirement-bound.",
    favorite: true,
    updatedAt: "2026-05-20T18:00:00Z"
  },
  {
    id: "prompt-003",
    title: "Nest Integration Boundary",
    category: "Software Architecture",
    description: "Keeps frontend services replaceable by future Nest.js APIs.",
    prompt: "Identify API boundaries, DTOs, loading states, and failure states without backend calls.",
    favorite: false,
    updatedAt: "2026-05-18T10:00:00Z"
  },
  {
    id: "prompt-004",
    title: "Research Claim Synthesizer",
    category: "Research",
    description: "Separates evidence, inference, contradiction, and unknowns.",
    prompt: "Synthesize claims into evidence-backed sections and flag unsupported conclusions.",
    favorite: false,
    updatedAt: "2026-05-16T10:00:00Z"
  },
  {
    id: "prompt-005",
    title: "Code Review Risk Lens",
    category: "Code Review",
    description: "Reviews code for bugs, regressions, and missing tests.",
    prompt: "Prioritize findings by severity with exact files and actionable fixes.",
    favorite: true,
    updatedAt: "2026-05-14T10:00:00Z"
  },
  {
    id: "prompt-006",
    title: "QA Audit Planner",
    category: "QA Audit",
    description: "Builds acceptance matrices for multi-agent workflow outputs.",
    prompt: "Turn the requirement contract into manual and automated acceptance checks.",
    favorite: false,
    updatedAt: "2026-05-12T10:00:00Z"
  },
  {
    id: "prompt-007",
    title: "Codex Patch Prompt",
    category: "Codex Prompts",
    description: "Scopes coding-agent tasks by file ownership and verification.",
    prompt: "Implement the following scoped change. Preserve unrelated edits. Verify with typecheck and build.",
    favorite: true,
    updatedAt: "2026-05-11T10:00:00Z"
  },
  {
    id: "prompt-008",
    title: "Workflow Resolver",
    category: "Agent Roles",
    description: "Converts critic findings into concrete resolution steps.",
    prompt: "Resolve each issue using minimal code and product changes. Keep the original motive locked.",
    favorite: false,
    updatedAt: "2026-05-09T10:00:00Z"
  }
];

export const usageSeries: UsagePoint[] = [
  { date: "May 15", input: 124000, output: 52000, cost: 28.1 },
  { date: "May 16", input: 98000, output: 43000, cost: 21.4 },
  { date: "May 17", input: 182000, output: 79000, cost: 39.9 },
  { date: "May 18", input: 146000, output: 61000, cost: 32.7 },
  { date: "May 19", input: 201000, output: 84000, cost: 47.6 },
  { date: "May 20", input: 238000, output: 91000, cost: 58.2 },
  { date: "May 21", input: 266000, output: 112000, cost: 66.5 }
];

export const providerCosts = [
  { name: "OpenAI", value: 162.4 },
  { name: "Claude", value: 126.1 },
  { name: "Gemini", value: 74.8 },
  { name: "Local", value: 0 },
  { name: "Custom", value: 21.3 }
];

export const projectCosts = [
  { name: "A.L.F.R.E.D.", value: 312.42 },
  { name: "VAPT Flow", value: 122.35 },
  { name: "Research", value: 74.08 },
  { name: "Migration", value: 158.93 },
  { name: "Prompts", value: 81.77 }
];

export const budgetRules: BudgetRule[] = [
  { id: "budget-001", label: "Monthly workspace budget", limit: 1000, used: 812, scope: "Workspace" },
  { id: "budget-002", label: "Claude critic loop cap", limit: 250, used: 211, scope: "Provider" },
  { id: "budget-003", label: "A.L.F.R.E.D. project cap", limit: 500, used: 312, scope: "Project" },
  { id: "budget-004", label: "Single workflow hard stop", limit: 75, used: 38.74, scope: "Workflow" }
];

export const activityTimeline = [
  { id: "act-001", title: "Gemini Architect started structural review", time: "2m ago", type: "agent" },
  { id: "act-002", title: "Requirement Contract locked for A.L.F.R.E.D. Platform", time: "18m ago", type: "lock" },
  { id: "act-003", title: "Claude Critic flagged graph density risk", time: "37m ago", type: "critique" },
  { id: "act-004", title: "Provider budget alert reached 80%", time: "1h ago", type: "budget" },
  { id: "act-005", title: "Codex Prompt Generator exported patch prompt", time: "2h ago", type: "artifact" }
];

export const compareResponses = [
  {
    model: "GPT-5",
    provider: "OpenAI",
    response:
      "Prioritize the workflow graph and make every agent action inspectable. Keep chat as the fast capture surface, then branch into governed runs.",
    tokens: 3410,
    cost: 0.13,
    latency: 4.2
  },
  {
    model: "Claude Opus",
    provider: "Anthropic Claude",
    response:
      "The key risk is requirement drift. Put the locked motive and critique verdict in persistent view before adding secondary dashboard metrics.",
    tokens: 2980,
    cost: 0.22,
    latency: 5.7
  },
  {
    model: "Gemini 2.5 Pro",
    provider: "Google Gemini",
    response:
      "Use project, workflow, and model configuration as distinct bounded contexts. Keep mock services shaped like future Nest controllers.",
    tokens: 3720,
    cost: 0.12,
    latency: 4.9
  },
  {
    model: "llama3.1:70b",
    provider: "Local/Ollama",
    response:
      "For private mode, route drafts through the local model and escalate only critic or architect tasks to hosted providers.",
    tokens: 1880,
    cost: 0,
    latency: 8.4
  }
];
