"use client";

import { Input } from "@/components/ui/input";
import type { Locale } from "@/lib/config";
import type { WorksheetBrandingConfig } from "@/lib/worksheet-branding-config";
import {
  brandingAddressLines,
  brandingContactLines,
  brandingFontStack,
  buildFooterSummary,
} from "@/lib/worksheet-letterhead";
import { formatPrintExportDate } from "@/lib/worksheet-print";
import { cn } from "@/lib/utils";

interface WorksheetLetterheadHeaderProps {
  branding: WorksheetBrandingConfig;
  documentTitle?: string;
  titleEditable?: boolean;
  onTitleChange?: (title: string) => void;
  titleAriaLabel?: string;
  className?: string;
  compact?: boolean;
}

export function WorksheetLetterheadHeader({
  branding,
  documentTitle,
  titleEditable = false,
  onTitleChange,
  titleAriaLabel,
  className,
  compact = false,
}: WorksheetLetterheadHeaderProps) {
  const addressLines = brandingAddressLines(branding.address);
  const contactLines = brandingContactLines(branding);
  const headerFont = brandingFontStack(branding.headerFontFamily);

  return (
    <header
      className={cn("text-[11px] leading-snug text-muted-foreground", className)}
      style={{ fontFamily: headerFont }}
    >
      <div
        className={cn(
          "flex items-start justify-between gap-4",
          compact ? "gap-3" : "gap-4",
        )}
      >
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {branding.logoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logoDataUrl}
              alt=""
              className={cn(
                "shrink-0 object-contain",
                compact ? "h-8 max-w-20" : "h-9 max-w-24",
              )}
            />
          ) : null}
          <div className="min-w-0">
            <p
              className={cn(
                "font-bold tracking-tight",
                compact ? "text-[13px]" : "text-sm",
              )}
              style={{ color: branding.primaryColor }}
            >
              {branding.brandName}
            </p>
            {branding.tagline.trim() ? (
              <p className="mt-0.5 text-[10px] italic text-muted-foreground/90">
                {branding.tagline}
              </p>
            ) : null}
            {addressLines.length > 0 ? (
              <p className="mt-1 whitespace-pre-line text-[10px] leading-relaxed text-muted-foreground">
                {addressLines.join("\n")}
              </p>
            ) : null}
            {contactLines.length > 0 ? (
              <p className="mt-1 text-[10px] text-muted-foreground">
                {contactLines.join(" · ")}
              </p>
            ) : null}
          </div>
        </div>

        {documentTitle !== undefined ? (
          titleEditable && onTitleChange ? (
            <Input
              value={documentTitle}
              onChange={(event) => onTitleChange(event.target.value)}
              className="h-7 max-w-[14rem] shrink-0 border-border bg-background text-right text-[11px] text-muted-foreground shadow-none"
              aria-label={titleAriaLabel}
            />
          ) : (
            <p className="max-w-[14rem] shrink-0 truncate text-right text-[11px] text-muted-foreground">
              {documentTitle}
            </p>
          )
        ) : null}
      </div>

      {branding.showHeaderDivider ? (
        <hr
          className="mt-3 border-0 border-t"
          style={{ borderColor: `${branding.primaryColor}59` }}
        />
      ) : null}
    </header>
  );
}

interface WorksheetLetterheadFooterProps {
  branding: WorksheetBrandingConfig;
  locale: Locale;
  exportDate?: string;
  pageLabel?: string;
  className?: string;
}

export function WorksheetLetterheadFooter({
  branding,
  locale,
  exportDate,
  pageLabel,
  className,
}: WorksheetLetterheadFooterProps) {
  const date = exportDate ?? formatPrintExportDate(locale);
  const footerFont = brandingFontStack(branding.footerFontFamily);
  const footerMain = buildFooterSummary(branding);
  const rightLabel = [footerMain, pageLabel].filter(Boolean).join(" · ");

  return (
    <footer
      className={cn(
        "flex items-start justify-between gap-4 border-t border-border pt-3 text-[10px] leading-snug text-muted-foreground",
        className,
      )}
      style={{ fontFamily: footerFont }}
    >
      <span>{date}</span>
      <span className="max-w-[65%] text-right">{rightLabel}</span>
    </footer>
  );
}