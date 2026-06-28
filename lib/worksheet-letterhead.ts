import type { Locale } from "@/lib/config";
import type {
  WorksheetBrandingConfig,
  WorksheetBrandingFontFamily,
} from "@/lib/worksheet-branding-config";
import { formatPrintExportDate } from "@/lib/worksheet-print";

const FONT_STACK: Record<WorksheetBrandingFontFamily, string> = {
  system:
    'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  sans: 'Arial, Helvetica, "Liberation Sans", sans-serif',
  serif: '"Times New Roman", Times, "Liberation Serif", serif',
};

export function brandingFontStack(
  family: WorksheetBrandingFontFamily,
): string {
  return FONT_STACK[family];
}

export function brandingAddressLines(address: string): string[] {
  return address
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function brandingContactLines(
  branding: WorksheetBrandingConfig,
): string[] {
  const lines: string[] = [];
  if (branding.phone.trim()) lines.push(branding.phone.trim());
  if (branding.email.trim()) lines.push(branding.email.trim());
  if (branding.website.trim()) lines.push(branding.website.trim());
  return lines;
}

export function hasEnhancedLetterhead(branding: WorksheetBrandingConfig): boolean {
  return Boolean(
    branding.tagline.trim() ||
      branding.address.trim() ||
      branding.phone.trim() ||
      branding.email.trim() ||
      branding.website.trim() ||
      branding.footerContactLine.trim(),
  );
}

export function buildFooterSummary(
  branding: WorksheetBrandingConfig,
): string {
  const parts = [branding.footerText.trim()];
  if (branding.footerContactLine.trim()) {
    parts.push(branding.footerContactLine.trim());
  }
  return parts.filter(Boolean).join(" · ");
}

export function computePdfHeaderZoneMm(
  branding: WorksheetBrandingConfig,
): number {
  let mm = 12;
  if (branding.tagline.trim()) mm += 3;
  mm += Math.min(brandingAddressLines(branding.address).length, 3) * 2.5;
  if (brandingContactLines(branding).length > 0) mm += 4;
  return Math.min(Math.max(mm, 12), 30);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildLetterheadCss(branding: WorksheetBrandingConfig): string {
  const primary = branding.primaryColor;
  const headerFont = brandingFontStack(branding.headerFontFamily);
  const footerFont = brandingFontStack(branding.footerFontFamily);

  return `
.worksheet-letterhead-header {
  font-family: ${headerFont};
  color: #444;
  font-size: 11px;
  line-height: 1.45;
}
.worksheet-letterhead-header .brand-name {
  color: ${primary};
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.worksheet-letterhead-header .brand-tagline {
  color: #555;
  font-size: 11px;
  font-style: italic;
  margin-top: 2px;
}
.worksheet-letterhead-header .brand-address,
.worksheet-letterhead-header .brand-contact {
  color: #666;
  font-size: 10px;
  margin-top: 4px;
}
.worksheet-letterhead-header .doc-title {
  color: #666;
  font-size: 11px;
  text-align: right;
}
.worksheet-letterhead-header-divider {
  border: none;
  border-top: 1px solid ${primary};
  margin: 10px 0 0;
  opacity: 0.35;
}
.worksheet-letterhead-footer {
  font-family: ${footerFont};
  color: #666;
  font-size: 10px;
  line-height: 1.45;
  border-top: 1px solid #ddd;
  padding-top: 8px;
  margin-top: 28px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
}
.worksheet-letterhead-footer .footer-main {
  text-align: right;
  max-width: 60%;
}
`.trim();
}

export function buildLetterheadHeaderHtml(options: {
  branding: WorksheetBrandingConfig;
  documentTitle?: string;
}): string {
  const { branding, documentTitle } = options;
  const logoHtml = branding.logoDataUrl
    ? `<img src="${branding.logoDataUrl.replace(/"/g, "&quot;")}" alt="" style="height:36px;max-width:110px;object-fit:contain;display:block;" />`
    : "";

  const taglineHtml = branding.tagline.trim()
    ? `<div class="brand-tagline">${escapeHtml(branding.tagline.trim())}</div>`
    : "";

  const addressLines = brandingAddressLines(branding.address);
  const addressHtml = addressLines.length
    ? `<div class="brand-address">${addressLines.map((line) => escapeHtml(line)).join("<br />")}</div>`
    : "";

  const contactLines = brandingContactLines(branding);
  const contactHtml = contactLines.length
    ? `<div class="brand-contact">${contactLines.map((line) => escapeHtml(line)).join(" · ")}</div>`
    : "";

  const titleHtml = documentTitle
    ? `<div class="doc-title">${escapeHtml(documentTitle)}</div>`
    : "";

  const dividerHtml = branding.showHeaderDivider
    ? `<hr class="worksheet-letterhead-header-divider" />`
    : "";

  return `
<header class="worksheet-letterhead-header">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;">
    <div style="display:flex;gap:12px;min-width:0;flex:1;">
      ${logoHtml ? `<div style="flex-shrink:0;">${logoHtml}</div>` : ""}
      <div style="min-width:0;">
        <div class="brand-name">${escapeHtml(branding.brandName)}</div>
        ${taglineHtml}
        ${addressHtml}
        ${contactHtml}
      </div>
    </div>
    ${titleHtml}
  </div>
  ${dividerHtml}
</header>`.trim();
}

export function buildLetterheadFooterHtml(options: {
  branding: WorksheetBrandingConfig;
  locale: Locale;
  exportDate?: string;
  pageLabel?: string;
}): string {
  const { branding, locale, pageLabel } = options;
  const exportDate = options.exportDate ?? formatPrintExportDate(locale);
  const footerMain = buildFooterSummary(branding);

  const rightParts = [footerMain];
  if (pageLabel) rightParts.push(pageLabel);

  return `
<footer class="worksheet-letterhead-footer">
  <span>${escapeHtml(exportDate)}</span>
  <span class="footer-main">${escapeHtml(rightParts.filter(Boolean).join(" · "))}</span>
</footer>`.trim();
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}