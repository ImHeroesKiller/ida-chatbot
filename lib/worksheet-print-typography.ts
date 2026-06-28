/**
 * Shared print-ready typography for Worksheet Full View, print preview HTML,
 * and PDF-aligned document rendering.
 */

export const WORKSHEET_PRINT_PROSE_CLASS = "ida-markdown worksheet-print-prose";

export const WORKSHEET_PRINT_PAPER_CLASS = "worksheet-print-paper";

export const WORKSHEET_PRINT_PROSE_CSS = `
.worksheet-print-prose {
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 14px;
  line-height: 1.65;
  color: #181818;
  text-align: left;
  word-wrap: break-word;
  overflow-wrap: break-word;
  -webkit-font-smoothing: antialiased;
}

.worksheet-print-prose > *:first-child {
  margin-top: 0 !important;
}

.worksheet-print-prose > *:last-child {
  margin-bottom: 0 !important;
}

.worksheet-print-prose p {
  margin: 0 0 0.75em;
  text-align: left;
}

.worksheet-print-prose p:last-child {
  margin-bottom: 0;
}

.worksheet-print-prose h1 {
  font-size: 1.714rem;
  font-weight: 700;
  line-height: 1.3;
  color: #181818;
  margin: 0 0 1em;
  letter-spacing: -0.02em;
}

.worksheet-print-prose h2 {
  font-size: 1.286rem;
  font-weight: 700;
  line-height: 1.35;
  color: #181818;
  margin: 1.35em 0 0.65em;
  letter-spacing: -0.01em;
}

.worksheet-print-prose h3 {
  font-size: 1.071rem;
  font-weight: 600;
  line-height: 1.4;
  color: #181818;
  margin: 1.1em 0 0.5em;
}

.worksheet-print-prose h4 {
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.4;
  color: #1f1f1f;
  margin: 0.95em 0 0.45em;
}

.worksheet-print-prose h5 {
  font-size: 0.929rem;
  font-weight: 600;
  line-height: 1.45;
  color: #222;
  margin: 0.85em 0 0.4em;
}

.worksheet-print-prose h6 {
  font-size: 0.857rem;
  font-weight: 600;
  line-height: 1.45;
  color: #333;
  margin: 0.75em 0 0.35em;
}

.worksheet-print-prose ul,
.worksheet-print-prose ol {
  margin: 0.55em 0 0.9em;
  padding-left: 1.5em;
}

.worksheet-print-prose ul {
  list-style-type: disc;
}

.worksheet-print-prose ol {
  list-style-type: decimal;
}

.worksheet-print-prose li {
  margin: 0.3em 0;
  line-height: 1.65;
  padding-left: 0.2em;
}

.worksheet-print-prose li > ul,
.worksheet-print-prose li > ol {
  margin-top: 0.3em;
  margin-bottom: 0.3em;
}

.worksheet-print-prose li::marker {
  color: #444;
}

.worksheet-print-prose table {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0 1.25em;
  font-size: 0.929rem;
  line-height: 1.5;
}

.worksheet-print-prose th,
.worksheet-print-prose td {
  border: 1px solid #ddd;
  padding: 0.5em 0.65em;
  text-align: left;
  vertical-align: top;
}

.worksheet-print-prose th {
  background-color: #ececec;
  font-weight: 600;
  color: #181818;
}

.worksheet-print-prose tbody tr:nth-child(even) td {
  background-color: #fafafa;
}

.worksheet-print-prose blockquote {
  margin: 1em 0;
  padding: 0.45em 0 0.45em 1em;
  border-left: 3px solid #b4b4b4;
  color: #555;
  font-style: italic;
}

.worksheet-print-prose blockquote p {
  margin-bottom: 0.5em;
}

.worksheet-print-prose blockquote p:last-child {
  margin-bottom: 0;
}

.worksheet-print-prose code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.92em;
  background: #f4f4f4;
  padding: 0.15em 0.35em;
  border-radius: 3px;
  color: #282828;
}

.worksheet-print-prose pre {
  margin: 0.85em 0 1em;
  padding: 0.75em 1em;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.857rem;
  line-height: 1.5;
}

.worksheet-print-prose pre code {
  background: transparent;
  padding: 0;
  border-radius: 0;
  font-size: inherit;
  color: #282828;
}

.worksheet-print-prose a {
  color: #1d4ed8;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.worksheet-print-prose strong {
  font-weight: 600;
}

.worksheet-print-prose em {
  font-style: italic;
}

.worksheet-print-prose hr {
  border: none;
  border-top: 1px solid #ddd;
  margin: 1.5em 0;
}

.worksheet-print-prose:empty::before {
  content: attr(data-placeholder);
  color: #999;
  pointer-events: none;
}

.worksheet-print-paper {
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.06),
    0 8px 24px rgba(0, 0, 0, 0.08);
}
`.trim();