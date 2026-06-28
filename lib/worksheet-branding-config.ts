import { IDA_CONFIG } from "@/lib/config";

export const WORKSHEET_BRANDING_CONFIG_KEY = "worksheet_branding";

export type WorksheetBrandingFontFamily = "system" | "serif" | "sans";

export interface WorksheetBrandingConfig {
  brandName: string;
  footerText: string;
  logoDataUrl: string | null;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  showHeaderDivider: boolean;
  footerContactLine: string;
  primaryColor: string;
  headerFontFamily: WorksheetBrandingFontFamily;
  footerFontFamily: WorksheetBrandingFontFamily;
}

export const DEFAULT_WORKSHEET_BRANDING_CONFIG: WorksheetBrandingConfig = {
  brandName: IDA_CONFIG.name,
  footerText: "Worksheet",
  logoDataUrl: null,
  tagline: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  showHeaderDivider: true,
  footerContactLine: "",
  primaryColor: "#171717",
  headerFontFamily: "sans",
  footerFontFamily: "sans",
};

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;
const FONT_FAMILIES: WorksheetBrandingFontFamily[] = ["system", "serif", "sans"];

function parseLogoDataUrl(value: unknown): string | null {
  return typeof value === "string" && value.startsWith("data:image/")
    ? value
    : null;
}

function parseFontFamily(value: unknown): WorksheetBrandingFontFamily {
  if (
    typeof value === "string" &&
    FONT_FAMILIES.includes(value as WorksheetBrandingFontFamily)
  ) {
    return value as WorksheetBrandingFontFamily;
  }
  return DEFAULT_WORKSHEET_BRANDING_CONFIG.headerFontFamily;
}

function parsePrimaryColor(value: unknown): string {
  if (typeof value === "string" && HEX_COLOR_RE.test(value.trim())) {
    return value.trim();
  }
  return DEFAULT_WORKSHEET_BRANDING_CONFIG.primaryColor;
}

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
      parsed.logoDataUrl === null
        ? null
        : parseLogoDataUrl(parsed.logoDataUrl) ??
          DEFAULT_WORKSHEET_BRANDING_CONFIG.logoDataUrl,
    tagline: parsed.tagline?.trim() ?? DEFAULT_WORKSHEET_BRANDING_CONFIG.tagline,
    address: parsed.address?.trim() ?? DEFAULT_WORKSHEET_BRANDING_CONFIG.address,
    phone: parsed.phone?.trim() ?? DEFAULT_WORKSHEET_BRANDING_CONFIG.phone,
    email: parsed.email?.trim() ?? DEFAULT_WORKSHEET_BRANDING_CONFIG.email,
    website: parsed.website?.trim() ?? DEFAULT_WORKSHEET_BRANDING_CONFIG.website,
    showHeaderDivider:
      typeof parsed.showHeaderDivider === "boolean"
        ? parsed.showHeaderDivider
        : DEFAULT_WORKSHEET_BRANDING_CONFIG.showHeaderDivider,
    footerContactLine:
      parsed.footerContactLine?.trim() ??
      DEFAULT_WORKSHEET_BRANDING_CONFIG.footerContactLine,
    primaryColor: parsePrimaryColor(parsed.primaryColor),
    headerFontFamily: parseFontFamily(parsed.headerFontFamily),
    footerFontFamily: parseFontFamily(parsed.footerFontFamily),
  };
}

function mergeField<T>(user: T | undefined, admin: T): T {
  if (user === undefined) return admin;
  return user;
}

export function mergeWorksheetBrandingPrefs(
  adminDefaults: WorksheetBrandingConfig,
  userPrefs: Partial<WorksheetBrandingConfig> | null,
  hasUserOverride: boolean,
): WorksheetBrandingConfig {
  if (!hasUserOverride) {
    return adminDefaults;
  }

  return parseWorksheetBrandingConfig({
    brandName: userPrefs?.brandName?.trim() || adminDefaults.brandName,
    footerText: userPrefs?.footerText?.trim() || adminDefaults.footerText,
    logoDataUrl: mergeField(userPrefs?.logoDataUrl, adminDefaults.logoDataUrl),
    tagline: userPrefs?.tagline?.trim() ?? adminDefaults.tagline,
    address: userPrefs?.address?.trim() ?? adminDefaults.address,
    phone: userPrefs?.phone?.trim() ?? adminDefaults.phone,
    email: userPrefs?.email?.trim() ?? adminDefaults.email,
    website: userPrefs?.website?.trim() ?? adminDefaults.website,
    showHeaderDivider:
      userPrefs?.showHeaderDivider ?? adminDefaults.showHeaderDivider,
    footerContactLine:
      userPrefs?.footerContactLine?.trim() ?? adminDefaults.footerContactLine,
    primaryColor: userPrefs?.primaryColor ?? adminDefaults.primaryColor,
    headerFontFamily:
      userPrefs?.headerFontFamily ?? adminDefaults.headerFontFamily,
    footerFontFamily:
      userPrefs?.footerFontFamily ?? adminDefaults.footerFontFamily,
  });
}