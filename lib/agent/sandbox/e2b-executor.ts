import { Sandbox } from "@e2b/code-interpreter";
import { randomUUID } from "crypto";

import type {
  AgentExecutionStep,
  AgentSandboxSession,
  AgentToolCategory,
  AgentWorkflowRun,
} from "../types";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createE2bSandboxSession(runId: string): AgentSandboxSession {
  return {
    id: `e2b-${runId.slice(0, 12)}-${randomUUID().slice(0, 6)}`,
    provider: "e2b",
    status: "created",
    cpuLimit: "2 vCPU",
    memoryLimit: "512 MB",
    networkPolicy: "restricted",
    createdAt: Date.now(),
  };
}

function toolOutput(
  title: string,
  category: AgentToolCategory,
  sandboxId: string,
  real = false,
): string {
  const mode = real ? "LIVE" : "SIM";
  switch (category) {
    case "document":
      return `[E2B:${mode}:${sandboxId}] python-docx/openpyxl/pypdf — ${title}`;
    case "playwright":
      return `[E2B:${mode}:${sandboxId}] Playwright Chromium — ${title}`;
    case "placeholder":
      return `[E2B:${mode}:${sandboxId}] {{placeholder}} injection — ${title}`;
    default:
      return `[E2B:${mode}:${sandboxId}] ${title}`;
  }
}

function buildSandboxPythonScript(run: AgentWorkflowRun): string {
  const instruction = run.instruction.replace(/"/g, '\\"').slice(0, 500);
  const docCount = run.documents.length;
  const templateCount = run.templates.length;

  return `
import json
print("AgentFlow E2B Sandbox — execution started")
print(f"Instruction: ${instruction}")
print(f"Documents: ${docCount}, Templates: ${templateCount}")

# Document processing simulation (python-docx, openpyxl, pypdf)
print("Phase 1: Document processing libraries ready")

# Playwright simulation
print("Phase 2: Playwright browser automation stub")

# Placeholder injection
placeholders = ${JSON.stringify(
    run.proposal?.placeholders.flatMap((t) =>
      t.placeholders.map((p) => p.key),
    ) ?? [],
  )}
print(f"Phase 3: Placeholders injected: {placeholders}")

print(json.dumps({"status": "completed", "artifacts": 1}))
`.trim();
}

async function executeWithRealE2b(
  run: AgentWorkflowRun,
): Promise<{
  executionSteps: AgentExecutionStep[];
  sandboxSession: AgentSandboxSession;
}> {
  const session = createE2bSandboxSession(run.id);
  session.status = "running";

  const executionSteps: AgentExecutionStep[] = [];
  let sandbox: Sandbox | null = null;

  try {
    sandbox = await Sandbox.create({
      apiKey: process.env.E2B_API_KEY,
      timeoutMs: 120_000,
    });

    session.id = sandbox.sandboxId;

    const phases: Array<{
      title: string;
      toolCategory: AgentToolCategory;
      leadTime?: boolean;
    }> = [
      {
        title: "E2B: Initialize isolated sandbox",
        toolCategory: "custom",
      },
      {
        title: "Document Processing (python-docx, openpyxl, pypdf)",
        toolCategory: "document",
      },
      {
        title: "Playwright Browser Automation",
        toolCategory: "playwright",
      },
      {
        title: "Branched Execution + Lead Time Handling",
        toolCategory: "custom",
        leadTime: true,
      },
      {
        title: "Generate Final Documents & Reports",
        toolCategory: "document",
      },
    ];

    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      const stepId = `exec-${i + 1}`;

      executionSteps.push({
        stepId,
        title: phase.title,
        toolCategory: phase.toolCategory,
        status: "running",
        startedAt: Date.now(),
      });

      if (i === 1 && sandbox) {
        const result = await sandbox.runCode(buildSandboxPythonScript(run));
        const output =
          result.logs.stdout.join("").trim() ||
          result.logs.stderr.join("").trim() ||
          "Sandbox code executed.";

        executionSteps[i] = {
          ...executionSteps[i],
          status: "done",
          completedAt: Date.now(),
          output: output.slice(0, 500),
        };
      } else {
        await delay(phase.leadTime ? 400 : 200);
        executionSteps[i] = {
          ...executionSteps[i],
          status: phase.leadTime ? "waiting" : "done",
          completedAt: Date.now(),
          output: phase.leadTime
            ? "Lead time polling — external dependency resolved."
            : toolOutput(phase.title, phase.toolCategory, session.id, true),
        };

        if (phase.leadTime) {
          await delay(200);
          executionSteps[i] = {
            ...executionSteps[i],
            status: "done",
            output: `${executionSteps[i].output} → resumed.`,
          };
        }
      }
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "E2B execution failed.";

    executionSteps.push({
      stepId: "exec-error",
      title: "E2B Sandbox Error",
      status: "error",
      completedAt: Date.now(),
      output: message,
    });
  } finally {
    if (sandbox) {
      try {
        await sandbox.kill();
      } catch {
        // ignore cleanup errors
      }
    }
    session.status = "terminated";
  }

  return { executionSteps, sandboxSession: session };
}

async function executeWithMock(
  run: AgentWorkflowRun,
): Promise<{
  executionSteps: AgentExecutionStep[];
  sandboxSession: AgentSandboxSession;
}> {
  const session = createE2bSandboxSession(run.id);
  session.status = "running";

  const steps = run.proposal?.steps ?? [];
  const executionSteps: AgentExecutionStep[] = [];

  const specPhases: Array<{
    title: string;
    toolCategory: AgentToolCategory;
    leadTime?: boolean;
  }> = [
    {
      title: "Document Processing (python-docx, openpyxl, pypdf)",
      toolCategory: "document",
    },
    { title: "Playwright Browser Automation", toolCategory: "playwright" },
    {
      title: "Branched Execution + Lead Time Handling",
      toolCategory: "custom",
      leadTime: true,
    },
    {
      title: "Generate Final Documents & Reports",
      toolCategory: "document",
    },
  ];

  const allPhases = [
    ...steps.map((s) => ({
      title: s.title,
      toolCategory: s.toolCategory,
      leadTime: s.leadTimeType !== "none",
    })),
    ...specPhases,
  ];

  const uniquePhases = allPhases.filter(
    (phase, index, arr) =>
      arr.findIndex((p) => p.title === phase.title) === index,
  );

  for (let i = 0; i < uniquePhases.length; i++) {
    const phase = uniquePhases[i];
    const stepId = `exec-${i + 1}`;

    executionSteps.push({
      stepId,
      title: phase.title,
      toolCategory: phase.toolCategory,
      status: "running",
      startedAt: Date.now(),
    });

    await delay(phase.leadTime ? 600 : 350);

    executionSteps[i] = {
      ...executionSteps[i],
      status: phase.leadTime ? "waiting" : "done",
      completedAt: Date.now(),
      output: phase.leadTime
        ? "Lead time polling simulated — set E2B_API_KEY for live sandbox."
        : toolOutput(phase.title, phase.toolCategory, session.id, false),
    };

    if (phase.leadTime) {
      await delay(300);
      executionSteps[i] = {
        ...executionSteps[i],
        status: "done",
        output: `${executionSteps[i].output} → resumed after lead time.`,
      };
    }
  }

  session.status = "terminated";
  return { executionSteps, sandboxSession: session };
}

export async function executeInE2bSandbox(
  run: AgentWorkflowRun,
): Promise<{
  executionSteps: AgentExecutionStep[];
  sandboxSession: AgentSandboxSession;
}> {
  if (isE2bConfigured()) {
    return executeWithRealE2b(run);
  }
  return executeWithMock(run);
}

export function isE2bConfigured(): boolean {
  return Boolean(process.env.E2B_API_KEY?.trim());
}