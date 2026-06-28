import { marked } from "marked";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

marked.setOptions({
  gfm: true,
  breaks: true,
});

let turndownService: TurndownService | null = null;

function configureTurndown(service: TurndownService): void {
  service.addRule("alignedBlocks", {
    filter(node) {
      const tag = node.nodeName;
      if (!/^(P|H[1-6])$/.test(tag)) return false;
      const style =
        (node as { getAttribute?: (name: string) => string | null }).getAttribute?.(
          "style",
        ) ?? "";
      const match = style.match(/text-align:\s*([^;]+)/i);
      const align = match?.[1]?.trim().toLowerCase();
      return Boolean(align && align !== "left" && align !== "start");
    },
    replacement(content, node) {
      const tag = node.nodeName.toLowerCase();
      const style =
        (node as { getAttribute?: (name: string) => string | null }).getAttribute?.(
          "style",
        ) ?? "";
      const match = style.match(/text-align:\s*([^;]+)/i);
      const align = match?.[1]?.trim() ?? "left";
      return `<${tag} style="text-align: ${align}">${content}</${tag}>\n\n`;
    },
  });
}

function getTurndownService(): TurndownService {
  if (!turndownService) {
    turndownService = new TurndownService({
      headingStyle: "atx",
      bulletListMarker: "-",
      codeBlockStyle: "fenced",
      emDelimiter: "*",
      strongDelimiter: "**",
    });
    turndownService.use(gfm);
    configureTurndown(turndownService);
  }

  return turndownService;
}

function normalizeEditorHtml(html: string): string {
  const trimmed = html.trim();
  if (
    !trimmed ||
    trimmed === "<br>" ||
    trimmed === "<div><br></div>" ||
    trimmed === "<p></p>" ||
    trimmed === "<p><br></p>"
  ) {
    return "<p></p>";
  }
  return trimmed;
}

export function markdownToEditorHtml(markdown: string): string {
  const trimmed = markdown.trim();
  if (!trimmed) return "<p></p>";

  const html = marked.parse(trimmed, { async: false });
  return typeof html === "string" ? html : "<p></p>";
}

export function editorHtmlToMarkdown(html: string): string {
  const normalized = normalizeEditorHtml(html);
  const markdown = getTurndownService().turndown(normalized).trim();
  return markdown;
}

export function isEditorHtmlEmpty(html: string): boolean {
  const markdown = editorHtmlToMarkdown(html);
  return !markdown.trim();
}

/** Strip noisy inline styles from pasted rich text (Word, Google Docs, etc.). */
export function sanitizePastedEditorHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<\/?(?:meta|link|xml|o:p|w:[^>]+|v:[^>]+)[^>]*>/gi, "")
    .replace(/\sclass="[^"]*"/gi, "")
    .replace(/\sstyle="[^"]*"/gi, "")
    .replace(/<span>([^<]*)<\/span>/gi, "$1")
    .trim();
}