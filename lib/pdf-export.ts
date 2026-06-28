import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

import { sanitizeWorksheetFilename } from "@/lib/worksheet";

export interface WorksheetPdfExportOptions {
  title: string;
  content: string;
  filename?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineMarkdown(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

export function markdownToExportHtml(title: string, markdown: string): string {
  const lines = markdown.split("\n");
  const parts: string[] = [
    `<h1 style="font-size:22px;font-weight:700;margin:0 0 16px;line-height:1.3;color:#111;">${escapeHtml(title)}</h1>`,
  ];

  let inList = false;

  const closeList = () => {
    if (inList) {
      parts.push("</ul>");
      inList = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      closeList();
      continue;
    }

    if (/^#{1,6}\s+/.test(trimmed)) {
      closeList();
      const level = trimmed.match(/^#+/)?.[0].length ?? 1;
      const text = trimmed.replace(/^#+\s+/, "");
      const sizes = ["22px", "18px", "16px", "15px", "14px", "13px"];
      const size = sizes[Math.min(level, 6) - 1];
      const tag = `h${Math.min(level, 6)}`;
      parts.push(
        `<${tag} style="font-size:${size};font-weight:600;margin:18px 0 8px;line-height:1.35;color:#111;">${inlineMarkdown(text)}</${tag}>`,
      );
      continue;
    }

    if (/^[-*+]\s+/.test(trimmed)) {
      if (!inList) {
        parts.push(
          '<ul style="margin:8px 0 12px 20px;padding:0;color:#222;">',
        );
        inList = true;
      }
      parts.push(
        `<li style="margin:4px 0;line-height:1.55;">${inlineMarkdown(trimmed.replace(/^[-*+]\s+/, ""))}</li>`,
      );
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      closeList();
      parts.push(
        `<p style="margin:8px 0 8px 16px;line-height:1.6;color:#222;">${inlineMarkdown(trimmed)}</p>`,
      );
      continue;
    }

    closeList();
    parts.push(
      `<p style="margin:0 0 10px;line-height:1.65;color:#222;">${inlineMarkdown(trimmed)}</p>`,
    );
  }

  closeList();
  return parts.join("");
}

function createExportContainer(title: string, content: string): HTMLDivElement {
  const container = document.createElement("div");
  container.setAttribute("data-worksheet-pdf-export", "true");
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width = "794px";
  container.style.padding = "48px 56px";
  container.style.background = "#ffffff";
  container.style.color = "#111111";
  container.style.fontFamily =
    'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  container.style.fontSize = "14px";
  container.style.lineHeight = "1.65";
  container.style.boxSizing = "border-box";
  container.innerHTML = markdownToExportHtml(title, content);
  return container;
}

export async function exportWorksheetToPdf(
  options: WorksheetPdfExportOptions,
): Promise<void> {
  const { title, content } = options;
  const trimmedContent = content.trim();
  if (!trimmedContent) {
    throw new Error("Worksheet content is empty.");
  }

  const container = createExportContainer(title.trim() || "Document", trimmedContent);
  document.body.appendChild(container);

  try {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const margin = 15;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const contentWidth = pageWidth - margin * 2;

    await new Promise<void>((resolve, reject) => {
      pdf
        .html(container, {
          callback: (doc) => {
            try {
              const filename =
                options.filename ??
                `${sanitizeWorksheetFilename(title)}.pdf`;
              doc.save(filename);
              resolve();
            } catch (error) {
              reject(error);
            }
          },
          margin: [margin, margin, margin, margin],
          width: contentWidth,
          windowWidth: 794,
          html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
            logging: false,
          },
        })
        .catch(reject);
    });
  } catch {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const margin = 15;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin * 2;

    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let offsetY = 0;
    let page = 0;

    while (offsetY < imgHeight) {
      if (page > 0) pdf.addPage();

      const sliceHeight = Math.min(contentHeight, imgHeight - offsetY);
      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = (sliceHeight * canvas.width) / imgWidth;

      const ctx = sliceCanvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable.");

      ctx.drawImage(
        canvas,
        0,
        (offsetY * canvas.width) / imgWidth,
        canvas.width,
        sliceCanvas.height,
        0,
        0,
        canvas.width,
        sliceCanvas.height,
      );

      pdf.addImage(
        sliceCanvas.toDataURL("image/png"),
        "PNG",
        margin,
        margin,
        imgWidth,
        sliceHeight,
      );

      offsetY += sliceHeight;
      page += 1;
    }

    const filename =
      options.filename ?? `${sanitizeWorksheetFilename(title)}.pdf`;
    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}