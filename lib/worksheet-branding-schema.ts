import { z } from "zod";

const fontFamilySchema = z.enum(["system", "serif", "sans"]);

export const worksheetBrandingConfigSchema = z.object({
  brandName: z.string().trim().min(1).max(120),
  footerText: z.string().trim().min(1).max(80),
  logoDataUrl: z
    .string()
    .nullable()
    .refine(
      (value) =>
        value === null ||
        (value.startsWith("data:image/") && value.length <= 250_000),
      "Invalid logo data URL.",
    ),
  tagline: z.string().trim().max(160).optional(),
  address: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().max(120).optional(),
  website: z.string().trim().max(200).optional(),
  showHeaderDivider: z.boolean().optional(),
  footerContactLine: z.string().trim().max(200).optional(),
  primaryColor: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  headerFontFamily: fontFamilySchema.optional(),
  footerFontFamily: fontFamilySchema.optional(),
});

export const worksheetLetterheadTemplateInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  brandingConfig: worksheetBrandingConfigSchema,
  isDefault: z.boolean().optional(),
});

export const worksheetLetterheadTemplateUpdateSchema =
  worksheetLetterheadTemplateInputSchema.partial();