import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const root = process.cwd();

function assertFile(relativePath) {
  assert.ok(fs.existsSync(path.join(root, relativePath)), `${relativePath} should exist`);
}

function loadTs(relativePath) {
  const fullPath = path.join(root, relativePath);
  const source = fs.readFileSync(fullPath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove
    }
  }).outputText;
  const module = { exports: {} };
  const sandbox = {
    exports: module.exports,
    module,
    Date,
    console,
    require: (id) => {
      throw new Error(`Unexpected runtime require in ${relativePath}: ${id}`);
    }
  };
  vm.runInNewContext(compiled, sandbox, { filename: relativePath });
  return module.exports;
}

const routeFiles = [
  "src/app/dashboard/page.tsx",
  "src/app/playground/page.tsx",
  "src/app/compare/page.tsx",
  "src/app/agent-studio/page.tsx",
  "src/app/projects/page.tsx",
  "src/app/projects/[id]/page.tsx",
  "src/app/workflows/page.tsx",
  "src/app/workflows/[id]/run/page.tsx",
  "src/app/models/page.tsx",
  "src/app/usage/page.tsx",
  "src/app/library/page.tsx",
  "src/app/settings/page.tsx",
  "src/app/workspaces/page.tsx",
  "src/app/workspaces/new/page.tsx",
  "src/app/workspaces/[id]/settings/page.tsx",
  "src/app/profile/page.tsx",
  "src/app/account/page.tsx",
  "src/app/billing/page.tsx",
  "src/app/keyboard-shortcuts/page.tsx"
];

for (const file of routeFiles) assertFile(file);

const { getChatDateGroup } = loadTs("src/lib/date-groups.ts");
const now = new Date("2026-05-29T12:00:00.000Z");
assert.equal(getChatDateGroup("2026-05-29T01:00:00.000Z", now), "Today");
assert.equal(getChatDateGroup("2026-05-28T01:00:00.000Z", now), "Yesterday");
assert.equal(getChatDateGroup("2026-05-24T01:00:00.000Z", now), "Last 7 Days");
assert.equal(getChatDateGroup("2026-05-01T10:00:00.000Z", now), "Older");

const { nextTheme, readStoredTheme, writeStoredTheme, THEME_STORAGE_KEY } = loadTs("src/lib/theme-utils.ts");
const storage = new Map();
const localStorageLike = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value)
};
assert.equal(nextTheme("dark"), "light");
assert.equal(readStoredTheme(localStorageLike), "dark");
writeStoredTheme(localStorageLike, "light");
assert.equal(storage.get(THEME_STORAGE_KEY), "light");
assert.equal(readStoredTheme(localStorageLike), "light");

const { createWorkspaceRecord, selectActiveWorkspace, updateWorkspaceRecord, getVisibleWorkspaces } = loadTs("src/lib/workspace-utils.ts");
const workspace = createWorkspaceRecord({ name: "A.L.F.R.E.D. Lab", monthlyTokenLimit: 500000 }, "2026-05-29T00:00:00.000Z");
assert.equal(workspace.name, "A.L.F.R.E.D. Lab");
assert.equal(workspace.monthlyTokenLimit, 500000);
const updated = updateWorkspaceRecord(workspace, { name: "Renamed Lab", monthlyCostLimit: 125 }, "2026-05-29T01:00:00.000Z");
assert.equal(updated.name, "Renamed Lab");
assert.equal(updated.monthlyCostLimit, 125);
const active = selectActiveWorkspace([workspace, { ...updated, id: "workspace-two" }], "workspace-two");
assert.equal(active[0].active, false);
assert.equal(active[1].active, true);
assert.equal(getVisibleWorkspaces([{ ...workspace, archived: true }, updated]).length, 1);

const {
  addWorkflowNode,
  connectWorkflowNodes,
  deleteWorkflowNode,
  resetWorkflowDsl,
  serializeWorkflowDsl,
  setWorkflowNodePosition,
  updateWorkflowNode
} = loadTs("src/lib/workflow-editor.ts");
const baseDsl = {
  version: "1.0",
  name: "Editor checks",
  nodes: [
    { key: "requirement_lock", type: "requirement_lock", title: "Requirement Lock" },
    { key: "critic", type: "critic", title: "Critic" },
    { key: "final_output", type: "final_output", title: "Final Output" }
  ],
  edges: [
    { key: "edge_requirement_lock_critic", from: "requirement_lock", to: "critic" },
    { key: "edge_critic_final_output", from: "critic", to: "final_output" }
  ],
  stopConditions: {
    maxIterations: 3,
    stopOnBudgetExceeded: true,
    stopOnRequirementDrift: true,
    stopOnUserStop: true
  }
};
const firstAdded = addWorkflowNode(baseDsl, "ai_agent", { x: 100, y: 200 });
const secondAdded = addWorkflowNode(firstAdded.dsl, "ai_agent", { x: 430, y: 200 });
assert.equal(firstAdded.node.key, "ai_agent");
assert.equal(secondAdded.node.key, "ai_agent_2");
const connected = connectWorkflowNodes(secondAdded.dsl, "ai_agent", "critic");
assert.equal(connected.edge.from, "ai_agent");
assert.ok(connectWorkflowNodes(connected.dsl, "ai_agent", "critic").error);
const edited = updateWorkflowNode(connected.dsl, "ai_agent", { title: "Planner" });
assert.equal(edited.nodes.find((node) => node.key === "ai_agent").title, "Planner");
const positioned = setWorkflowNodePosition(edited, "ai_agent", { x: 700, y: 320 });
assert.deepEqual(positioned.nodes.find((node) => node.key === "ai_agent").config.ui.position, { x: 700, y: 320 });
const deleted = deleteWorkflowNode(positioned, "critic");
assert.ok(!deleted.dsl.nodes.some((node) => node.key === "critic"));
assert.ok(!deleted.dsl.edges.some((edge) => edge.from === "critic" || edge.to === "critic"));
const reset = resetWorkflowDsl(baseDsl);
reset.name = "Changed copy";
assert.equal(baseDsl.name, "Editor checks");
assert.deepEqual(JSON.parse(serializeWorkflowDsl(baseDsl)), baseDsl);

console.log("Frontend confidence checks passed.");
