export const budgetConfig = () => ({
  defaultMaxIterations: Number(process.env.DEFAULT_MAX_WORKFLOW_ITERATIONS ?? 3),
  defaultWorkflowBudgetUsd: Number(process.env.DEFAULT_WORKFLOW_BUDGET_USD ?? 5),
  defaultMaxTokensPerRun: Number(process.env.DEFAULT_MAX_TOKENS_PER_RUN ?? 100000)
});
