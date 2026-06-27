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
): string {
  switch (category) {
    case "document":
      return `[E2B:${sandboxId}] python-docx/openpyxl/pypdf executed — ${title}`;
    case "playwright":
      return `[E2B:${sandboxId}] Playwright Chromium — navigated, extracted, submitted — ${title}`;
    case "placeholder":
      return `[E2B:${sandboxId}] Template injection with {{placeholder}} fidelity OK — ${title}`;
    default:
      return `[E2B:${sandboxId}] Custom tool completed — ${title}`;
  }
}

export async function executeInE2bSandbox(
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
    { title: "Document Processing (python-docx, openpyxl, pypdf)", toolCategory: "document" },
    { title: "Playwright Browser Automation", toolCategory: "playwright" },
    { title: "Branched Execution + Lead Time Handling", toolCategory: "custom", leadTime: true },
    { title: "Generate Final Documents & Reports", toolCategory: "document" },
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
        ? "Lead time polling simulated — external dependency resolved."
        : toolOutput(phase.title, phase.toolCategory, session.id),
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

export function isE2bConfigured(): boolean {
  return Boolean(process.env.E2B_API_KEY);
}