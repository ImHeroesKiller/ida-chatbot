"use client";

import { useEffect } from "react";

interface LocaleHtmlLangProps {
  locale: string;
}

export function LocaleHtmlLang({ locale }: LocaleHtmlLangProps) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}