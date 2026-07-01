import { marked } from "marked";

marked.setOptions({
  gfm: true,
  breaks: true,
});

const WORKFLOW_LOG_LINE =
  /^\[(?:trigger|action|condition|output|approval)\]\s*[^:]+:\s*/i;

const IDA_MARKERS =
  /<<<IDA_(?:WORKFLOW|WORKSHEET)_(?:START|END)>>>|<<<END_IDA_(?:WORKFLOW|WORKSHEET)>>>/gi;

function unwrapMarkdownFences(text: string): string {
  const fenced = text.match(/^```(?:markdown|md|text)?\s*\n?([\s\S]*?)\n?```$/i);
  if (fenced?.[1]) return fenced[1].trim();

  return text
    .replace(/```(?:json|workflow|javascript|typescript|html|xml)?\s*[\s\S]*?```/gi, "")
    .trim();
}

function stripWrapperTags(text: string): string {
  return text
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/?(?:response|output|result|worksheet|document|content|markdown|artifact)[^>]*>/gi, "")
    .replace(/<\/?(?:xml|html|body|head)[^>]*>/gi, "")
    .trim();
}

function stripWorkflowLogPrefixes(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(WORKFLOW_LOG_LINE, "").trimEnd())
    .join("\n");
}

function extractMeaningfulWorkflowContext(context: string): string {
  const blocks = context
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .filter(
      (block) =>
        !/^(Waiting for|Retry \d|Running|Approved|Rejected|Skipped)/i.test(
          block,
        ),
    );

  if (blocks.length === 0) return context.trim();

  const contentBlocks = blocks.filter((block) =>
    /^\[(?:trigger|action|condition|output|approval)\]/i.test(block),
  );

  const source = contentBlocks.length > 0 ? contentBlocks : blocks;
  return source
    .map((block) => block.replace(WORKFLOW_LOG_LINE, "").trim())
    .filter(Boolean)
    .join("\n\n");
}

function resolveTemplateTokens(
  text: string,
  options?: { workflowContext?: string; title?: string },
): string {
  const contextBody = options?.workflowContext
    ? extractMeaningfulWorkflowContext(options.workflowContext)
    : "";

  return text
    .replace(/\{\{context\}\}/gi, contextBody)
    .replace(/\{\{title\}\}/gi, options?.title?.trim() ?? "")
    .replace(/\{\{prompt\}\}/gi, "")
    .replace(/\{\{label\}\}/gi, options?.title?.trim() ?? "");
}

/**
 * Normalize worksheet body produced by workflow `worksheet_update` actions.
 */
export function cleanWorksheetWorkflowOutput(
  raw: string,
  options?: { workflowContext?: string; title?: string },
): string {
  let text = raw.trim();
  if (!text) return "";

  text = text.replace(IDA_MARKERS, "");
  text = unwrapMarkdownFences(text);
  text = stripWrapperTags(text);
  text = resolveTemplateTokens(text, options);
  text = stripWorkflowLogPrefixes(text);
  text = text.replace(/\n{3,}/g, "\n\n").trim();

  return text;
}

/** Rich HTML for print/export — uses the same GFM parser as the editor. */
export function markdownToRichDocumentHtml(markdown: string): string {
  const cleaned = cleanWorksheetWorkflowOutput(markdown);
  if (!cleaned) return "";

  const html = marked.parse(cleaned, { async: false });
  return typeof html === "string" ? html : "";
}