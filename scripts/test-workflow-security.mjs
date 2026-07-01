#!/usr/bin/env node

import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const output = execSync(
  `npx --yes tsx -e ${JSON.stringify(
    'import { canAccessWorkflow, canApproveAtLevel, createDefaultWorkflowSecurity, normalizeWorkflowSecurity } from "./lib/workflow-security/permissions.ts"; ' +
      'import { applyApprovalDecision, createApprovalState, isApprovalChainComplete } from "./lib/workflow-security/approval-hierarchy.ts"; ' +
      "const security = normalizeWorkflowSecurity({ visibility: 'company', ownerId: 'owner-1', permissions: [{ userId: 'editor-1', role: 'editor' }] }, 'owner-1'); " +
      "const state = createApprovalState('node-1', [{ level: 1, label: 'L1' }, { level: 2, label: 'L2' }]); " +
      "const afterL1 = applyApprovalDecision({ state, action: 'approve', actorId: 'owner-1' }); " +
      "console.log(JSON.stringify({ " +
      "ownerCanExecute: canAccessWorkflow(security, 'owner-1', 'execute'), " +
      "editorCanExecute: canAccessWorkflow(security, 'editor-1', 'execute'), " +
      "viewerCompanyCanView: canAccessWorkflow(security, 'viewer-9', 'view'), " +
      "viewerCannotExecute: !canAccessWorkflow(security, 'viewer-9', 'execute'), " +
      "ownerCanApproveL2: canApproveAtLevel(security, 'owner-1', 2), " +
      "afterL1Level: afterL1.currentLevel, " +
      "chainIncomplete: !isApprovalChainComplete(afterL1) " +
      "}));",
  )}`,
  { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
);

const result = JSON.parse(output.trim());

assert(result.ownerCanExecute === true, "owner can execute");
assert(result.editorCanExecute === true, "editor can execute");
assert(result.viewerCompanyCanView === true, "company visibility allows view");
assert(result.viewerCannotExecute === true, "random viewer cannot execute");
assert(result.ownerCanApproveL2 === true, "owner can approve level 2");
assert(result.afterL1Level === 2, "level advances after first approval");
assert(result.chainIncomplete === true, "chain not complete after one level");

console.log("PASS: workflow RBAC and multi-level approval");
console.log("\nAll workflow security tests passed.");