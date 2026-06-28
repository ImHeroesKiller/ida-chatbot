import { marked } from "marked";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

marked.setOptions({
  gfm: true,
  breaks: true,
});

let turndownService: TurndownService | null = null;

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
  }

  return turndownService;
}

function normalizeEditorHtml(html: string): string {
  const trimmed = html.trim();
  if (!trimmed || trimmed === "<br>" || trimmed === "<div><br></div>") {
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