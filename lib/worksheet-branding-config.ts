import { IDA_CONFIG } from "@/lib/config";

export const WORKSHEET_BRANDING_CONFIG_KEY = "worksheet_branding";

export interface WorksheetBrandingConfig {
  brandName: string;
  footerText: string;
  logoDataUrl: string | null;
}

export const DEFAULT_WORKSHEET_BRANDING_CONFIG: WorksheetBrandingConfig = {
  brandName: IDA_CONFIG.name,
  footerText: "Worksheet",
  logoDataUrl: null,
};

export function parseWorksheetBrandingConfig(
  raw: unknown,
): WorksheetBrandingConfig {
  if (!raw || typeof raw !== "object") {
    return DEFAULT_WORKSHEET_BRANDING_CONFIG;
  }

  const parsed = raw as Partial<WorksheetBrandingConfig>;

  return {
    brandName:
      parsed.brandName?.trim() || DEFAULT_WORKSHEET_BRANDING_CONFIG.brandName,
    footerText:
      parsed.footerText?.trim() || DEFAULT_WORKSHEET_BRANDING_CONFIG.footerText,
    logoDataUrl:
      typeof parsed.logoDataUrl === "string" &&
      parsed.logoDataUrl.startsWith("data:image/")
        ? parsed.logoDataUrl
        : null,
  };
}

export function mergeWorksheetBrandingPrefs(
  adminDefaults: WorksheetBrandingConfig,
  userPrefs: Partial<WorksheetBrandingConfig> | null,
  hasUserOverride: boolean,
): WorksheetBrandingConfig {
  if (!hasUserOverride) {
    return adminDefaults;
  }

  return {
    brandName:
      userPrefs?.brandName?.trim() || adminDefaults.brandName,
    footerText:
      userPrefs?.footerText?.trim() || adminDefaults.footerText,
    logoDataUrl:
      userPrefs?.logoDataUrl !== undefined
        ? userPrefs.logoDataUrl
        : adminDefaults.logoDataUrl,
  };
}