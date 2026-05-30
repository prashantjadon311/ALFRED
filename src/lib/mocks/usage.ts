import type { BudgetRule, UsagePoint } from "@/lib/types";

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
