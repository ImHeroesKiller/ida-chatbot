#!/usr/bin/env node

import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function loadModule() {
  const snippet =
    'import { cleanWorksheetWorkflowOutput, markdownToRichDocumentHtml } from "./lib/worksheet-workflow-output.ts"; ' +
    "const raw = '```markdown\\n# Report\\n[action] Draft: Hello **world**\\n```'; " +
    "const context = '[trigger] Start: ok\\n\\n[action] Gather data: Line one\\n\\n[output] Final: Done'; " +
    "const cleaned = cleanWorksheetWorkflowOutput('{{context}}', { workflowContext: context, title: 'Monthly Report' }); " +
    "const html = markdownToRichDocumentHtml('# Title\\n\\n- item one'); " +
    "console.log(JSON.stringify({ noMarkers: !cleaned.includes('<<<'), noLogPrefix: !/\\[action\\]/i.test(cleaned), hasContext: cleaned.includes('Line one'), hasHtml: html.includes('<h1>') && html.includes('<li>') }));";

  const output = execSync(`npx --yes tsx -e ${JSON.stringify(snippet)}`, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return JSON.parse(output.trim());
}

const result = loadModule();

assert(result.noMarkers === true, "strips IDA markers");
assert(result.noLogPrefix === true, "strips workflow log prefixes");
assert(result.hasContext === true, "resolves {{context}} with meaningful body");
assert(result.hasHtml === true, "markdown converts to rich HTML");

console.log("PASS: worksheet workflow output cleaning");
console.log("\nAll worksheet workflow output tests passed.");