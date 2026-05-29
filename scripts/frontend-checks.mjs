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

console.log("Frontend confidence checks passed.");
