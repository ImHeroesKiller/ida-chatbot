import type {
  AgentCompanyTemplate,
  AgentPlaceholderPreview,
  AgentWorkflowRun,
} from "../types";

const PLACEHOLDER_PATTERN = /\{\{([a-zA-Z0-9_]+)\}\}/g;

export function detectPlaceholdersInText(text: string): string[] {
  const found = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = PLACEHOLDER_PATTERN.exec(text)) !== null) {
    found.add(`{{${match[1]}}}`);
  }

  return [...found];
}

export function validateTemplateFidelity(template: {
  fileName: string;
  placeholdersDetected: string[];
}): { status: "valid" | "warning" | "invalid"; notes: string[] } {
  const notes: string[] = [];

  if (template.placeholdersDetected.length === 0) {
    notes.push(
      `${template.fileName}: tidak ada placeholder {{variable}} terdeteksi — periksa template.`,
    );
    return { status: "warning", notes };
  }

  const invalid = template.placeholdersDetected.filter(
    (ph) => !/^\{\{[a-zA-Z0-9_]+\}\}$/.test(ph),
  );

  if (invalid.length > 0) {
    notes.push(`${template.fileName}: format placeholder tidak valid.`);
    return { status: "invalid", notes };
  }

  return { status: "valid", notes };
}

export function buildPlaceholderInjectionPreview(
  run: AgentWorkflowRun,
  templates: AgentCompanyTemplate[],
): AgentPlaceholderPreview[] {
  const variableMap: Record<string, { value: string; source: string }> = {
    "{{instruction}}": {
      value: run.instruction.slice(0, 300),
      source: "user instruction",
    },
    "{{document_count}}": {
      value: String(run.documents.length),
      source: "uploaded documents",
    },
    "{{analysis_summary}}": {
      value: run.analysis?.summary.slice(0, 400) ?? "",
      source: "document analysis",
    },
    "{{workflow_title}}": {
      value: run.proposal?.title ?? "AgentFlow Workflow",
      source: "workflow proposal",
    },
    "{{date}}": {
      value: new Date().toISOString().slice(0, 10),
      source: "system",
    },
  };

  return templates.map((template) => ({
    templateName: template.fileName,
    placeholders: template.placeholdersDetected.map((key) => {
      const mapped = variableMap[key];
      return {
        key,
        value: mapped?.value ?? `[auto:${key.replace(/[{}]/g, "")}]`,
        source: mapped?.source ?? "inferred",
        fidelityOk: Boolean(mapped),
      };
    }),
  }));
}

export function extractTemplatePlaceholdersFromName(
  fileName: string,
): string[] {
  const defaults = ["{{instruction}}", "{{date}}", "{{analysis_summary}}"];

  if (/letter|surat|email/i.test(fileName)) {
    return [...defaults, "{{recipient}}", "{{workflow_title}}"];
  }

  if (/report|laporan/i.test(fileName)) {
    return [...defaults, "{{document_count}}", "{{period}}"];
  }

  return defaults;
}

export function processUploadedTemplate(payload: {
  fileName: string;
  fileType: "docx" | "pdf";
  sizeBytes: number;
}): AgentCompanyTemplate {
  const placeholdersDetected = extractTemplatePlaceholdersFromName(
    payload.fileName,
  );
  const fidelity = validateTemplateFidelity({
    fileName: payload.fileName,
    placeholdersDetected,
  });

  return {
    id: `tpl-${Date.now()}`,
    fileName: payload.fileName,
    fileType: payload.fileType,
    sizeBytes: payload.sizeBytes,
    placeholdersDetected,
    fidelityStatus: fidelity.status,
    fidelityNotes: fidelity.notes,
  };
}