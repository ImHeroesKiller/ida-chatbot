export interface TextSelectionRange {
  start: number;
  end: number;
}

export interface TextEditResult {
  value: string;
  selection: TextSelectionRange;
}

function clampSelection(value: string, start: number, end: number): TextSelectionRange {
  const length = value.length;
  return {
    start: Math.max(0, Math.min(start, length)),
    end: Math.max(0, Math.min(end, length)),
  };
}

export function wrapMarkdownSelection(
  value: string,
  selection: TextSelectionRange,
  before: string,
  after: string,
  placeholder = "text",
): TextEditResult {
  const { start, end } = clampSelection(value, selection.start, selection.end);
  const selected = value.slice(start, end) || placeholder;
  const nextValue =
    value.slice(0, start) + before + selected + after + value.slice(end);
  const cursorStart = start + before.length;
  const cursorEnd = cursorStart + selected.length;

  return {
    value: nextValue,
    selection: { start: cursorStart, end: cursorEnd },
  };
}

export function insertMarkdownPrefix(
  value: string,
  selection: TextSelectionRange,
  prefix: string,
): TextEditResult {
  const { start, end } = clampSelection(value, selection.start, selection.end);
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const lineEnd = value.indexOf("\n", end);
  const blockEnd = lineEnd === -1 ? value.length : lineEnd;
  const block = value.slice(lineStart, blockEnd);

  const lines = block.split("\n").map((line) => {
    const trimmed = line.trimStart();
    if (!trimmed) return line;
    if (trimmed.startsWith(prefix.trim())) return line;
    const leading = line.slice(0, line.length - trimmed.length);
    return `${leading}${prefix}${trimmed}`;
  });

  const nextBlock = lines.join("\n");
  const nextValue = value.slice(0, lineStart) + nextBlock + value.slice(blockEnd);

  return {
    value: nextValue,
    selection: {
      start: lineStart,
      end: lineStart + nextBlock.length,
    },
  };
}

export function insertMarkdownSnippet(
  value: string,
  selection: TextSelectionRange,
  snippet: string,
): TextEditResult {
  const { start, end } = clampSelection(value, selection.start, selection.end);
  const nextValue = value.slice(0, start) + snippet + value.slice(end);
  const cursor = start + snippet.length;

  return {
    value: nextValue,
    selection: { start: cursor, end: cursor },
  };
}

export function insertMarkdownLink(
  value: string,
  selection: TextSelectionRange,
): TextEditResult {
  const { start, end } = clampSelection(value, selection.start, selection.end);
  const label = value.slice(start, end) || "link text";
  const snippet = `[${label}](https://)`;
  const nextValue = value.slice(0, start) + snippet + value.slice(end);
  const urlStart = start + label.length + 3;
  const urlEnd = urlStart + 8;

  return {
    value: nextValue,
    selection: { start: urlStart, end: urlEnd },
  };
}