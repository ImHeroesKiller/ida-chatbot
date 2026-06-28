"use client";

import { WORKSHEET_PRINT_PROSE_CSS } from "@/lib/worksheet-print-typography";

export function WorksheetPrintTypographyStyles() {
  return (
    <style
      data-worksheet-print-typography=""
      dangerouslySetInnerHTML={{ __html: WORKSHEET_PRINT_PROSE_CSS }}
    />
  );
}