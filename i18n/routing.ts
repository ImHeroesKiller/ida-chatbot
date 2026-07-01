import { defineRouting } from "next-intl/routing";

import { LOCALES } from "@/lib/config";

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: "id",
  localePrefix: "as-needed",
  localeDetection: true,
});