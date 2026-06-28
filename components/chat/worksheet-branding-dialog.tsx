"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ImageIcon, Palette, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";

import {
  WorksheetLetterheadFooter,
  WorksheetLetterheadHeader,
} from "@/components/chat/worksheet-letterhead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import {
  DEFAULT_WORKSHEET_BRANDING_CONFIG,
  parseWorksheetBrandingConfig,
  type WorksheetBrandingConfig,
  type WorksheetBrandingFontFamily,
} from "@/lib/worksheet-branding-config";
import {
  readLogoFileAsDataUrl,
  useWorksheetBrandingPrefs,
} from "@/lib/worksheet-branding-prefs";
import { WORKSHEET_MODAL_OVERLAY_CLASS } from "@/lib/worksheet-overlay";
import { cn } from "@/lib/utils";

type BrandingTab = "header" | "footer" | "styling";

interface WorksheetBrandingDialogProps {
  open: boolean;
  locale: Locale;
  onClose: () => void;
}

export function WorksheetBrandingDialog({
  open,
  locale,
  onClose,
}: WorksheetBrandingDialogProps) {
  const copy = COPY[locale];
  const { prefs, adminDefaults, hydrated, updatePrefs, resetPrefs } =
    useWorksheetBrandingPrefs();
  const [draft, setDraft] = useState<WorksheetBrandingConfig>(prefs);
  const [tab, setTab] = useState<BrandingTab>("header");

  useEffect(() => {
    if (open && hydrated) {
      setDraft(prefs);
      setTab("header");
    }
  }, [hydrated, open, prefs]);

  const handleSave = () => {
    updatePrefs(parseWorksheetBrandingConfig(draft));
    toast.success(copy.worksheetBrandingSaved);
    onClose();
  };

  const handleLogoChange = async (file: File | undefined) => {
    if (!file) return;

    try {
      const dataUrl = await readLogoFileAsDataUrl(file);
      setDraft((current) => ({ ...current, logoDataUrl: dataUrl }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : copy.errors.generic;
      toast.error(message);
    }
  };

  const tabButtonClass = (value: BrandingTab) =>
    cn(
      "h-8 rounded-md px-3 text-xs",
      tab === value
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:bg-muted/60",
    );

  const fontLabel = (family: WorksheetBrandingFontFamily) => {
    switch (family) {
      case "serif":
        return copy.worksheetBrandingFontSerif;
      case "sans":
        return copy.worksheetBrandingFontSans;
      default:
        return copy.worksheetBrandingFontSystem;
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "fixed inset-0 flex items-center justify-center bg-black/50 p-4",
            WORKSHEET_MODAL_OVERLAY_CLASS,
          )}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[min(92vh,40rem)] w-full max-w-2xl flex-col"
          >
            <Card className="flex min-h-0 flex-1 flex-col shadow-2xl">
              <CardHeader className="shrink-0 pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Palette className="h-4 w-4 text-primary" />
                  {copy.worksheetBrandingTitle}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {copy.worksheetBrandingDescription}
                </p>
                <div className="mt-3 inline-flex rounded-lg border bg-muted/20 p-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    className={tabButtonClass("header")}
                    onClick={() => setTab("header")}
                  >
                    {copy.worksheetBrandingTabHeader}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className={tabButtonClass("footer")}
                    onClick={() => setTab("footer")}
                  >
                    {copy.worksheetBrandingTabFooter}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className={tabButtonClass("styling")}
                    onClick={() => setTab("styling")}
                  >
                    {copy.worksheetBrandingTabStyling}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
                <ScrollArea className="min-h-0 flex-1 pr-3">
                  <div className="space-y-4 pb-2">
                    {tab === "header" ? (
                      <>
                        <p className="text-[11px] font-medium text-muted-foreground">
                          {copy.worksheetBrandingLetterheadSection}
                        </p>

                        <div className="space-y-2">
                          <Label htmlFor="worksheet-brand-name" className="text-xs">
                            {copy.worksheetBrandingBrandName}
                          </Label>
                          <Input
                            id="worksheet-brand-name"
                            value={draft.brandName}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                brandName: event.target.value,
                              }))
                            }
                            placeholder={DEFAULT_WORKSHEET_BRANDING_CONFIG.brandName}
                            className="h-9 text-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="worksheet-brand-tagline" className="text-xs">
                            {copy.worksheetBrandingTagline}
                          </Label>
                          <Input
                            id="worksheet-brand-tagline"
                            value={draft.tagline}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                tagline: event.target.value,
                              }))
                            }
                            placeholder={copy.worksheetBrandingTaglinePlaceholder}
                            className="h-9 text-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="worksheet-brand-address" className="text-xs">
                            {copy.worksheetBrandingAddress}
                          </Label>
                          <Textarea
                            id="worksheet-brand-address"
                            value={draft.address}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                address: event.target.value,
                              }))
                            }
                            placeholder={copy.worksheetBrandingAddressPlaceholder}
                            className="min-h-20 text-sm"
                            spellCheck={false}
                          />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="worksheet-brand-phone" className="text-xs">
                              {copy.worksheetBrandingPhone}
                            </Label>
                            <Input
                              id="worksheet-brand-phone"
                              value={draft.phone}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  phone: event.target.value,
                                }))
                              }
                              placeholder={copy.worksheetBrandingPhonePlaceholder}
                              className="h-9 text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="worksheet-brand-email" className="text-xs">
                              {copy.worksheetBrandingEmail}
                            </Label>
                            <Input
                              id="worksheet-brand-email"
                              value={draft.email}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  email: event.target.value,
                                }))
                              }
                              placeholder={copy.worksheetBrandingEmailPlaceholder}
                              className="h-9 text-sm"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="worksheet-brand-website" className="text-xs">
                            {copy.worksheetBrandingWebsite}
                          </Label>
                          <Input
                            id="worksheet-brand-website"
                            value={draft.website}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                website: event.target.value,
                              }))
                            }
                            placeholder={copy.worksheetBrandingWebsitePlaceholder}
                            className="h-9 text-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="worksheet-brand-logo" className="text-xs">
                            {copy.worksheetBrandingLogo}
                          </Label>
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/30">
                              {draft.logoDataUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={draft.logoDataUrl}
                                  alt=""
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <ImageIcon className="h-5 w-5 text-muted-foreground/60" />
                              )}
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col gap-2">
                              <Input
                                id="worksheet-brand-logo"
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/gif"
                                className="h-9 text-xs file:mr-2 file:text-xs"
                                onChange={(event) =>
                                  void handleLogoChange(event.target.files?.[0])
                                }
                              />
                              {draft.logoDataUrl ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-fit gap-1.5 px-2 text-xs text-destructive hover:text-destructive"
                                  onClick={() =>
                                    setDraft((current) => ({
                                      ...current,
                                      logoDataUrl: null,
                                    }))
                                  }
                                >
                                  <Trash2 className="h-3 w-3" />
                                  {copy.worksheetBrandingRemoveLogo}
                                </Button>
                              ) : (
                                <p className="text-[11px] text-muted-foreground">
                                  {copy.worksheetBrandingLogoHint}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <label className="flex items-center gap-2 text-xs text-foreground">
                          <input
                            type="checkbox"
                            checked={draft.showHeaderDivider}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                showHeaderDivider: event.target.checked,
                              }))
                            }
                            className="rounded border-input"
                          />
                          {copy.worksheetBrandingShowHeaderDivider}
                        </label>
                      </>
                    ) : null}

                    {tab === "footer" ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="worksheet-footer-text" className="text-xs">
                            {copy.worksheetBrandingFooterText}
                          </Label>
                          <Input
                            id="worksheet-footer-text"
                            value={draft.footerText}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                footerText: event.target.value,
                              }))
                            }
                            placeholder={DEFAULT_WORKSHEET_BRANDING_CONFIG.footerText}
                            className="h-9 text-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="worksheet-footer-contact"
                            className="text-xs"
                          >
                            {copy.worksheetBrandingFooterContact}
                          </Label>
                          <Input
                            id="worksheet-footer-contact"
                            value={draft.footerContactLine}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                footerContactLine: event.target.value,
                              }))
                            }
                            placeholder={copy.worksheetBrandingFooterContactPlaceholder}
                            className="h-9 text-sm"
                          />
                        </div>
                      </>
                    ) : null}

                    {tab === "styling" ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="worksheet-primary-color" className="text-xs">
                            {copy.worksheetBrandingPrimaryColor}
                          </Label>
                          <div className="flex items-center gap-2">
                            <input
                              id="worksheet-primary-color"
                              type="color"
                              value={draft.primaryColor}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  primaryColor: event.target.value,
                                }))
                              }
                              className="h-9 w-12 cursor-pointer rounded border bg-background"
                            />
                            <Input
                              value={draft.primaryColor}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  primaryColor: event.target.value,
                                }))
                              }
                              className="h-9 font-mono text-sm"
                              spellCheck={false}
                            />
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="worksheet-header-font" className="text-xs">
                              {copy.worksheetBrandingHeaderFont}
                            </Label>
                            <select
                              id="worksheet-header-font"
                              value={draft.headerFontFamily}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  headerFontFamily: event.target
                                    .value as WorksheetBrandingFontFamily,
                                }))
                              }
                              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                              <option value="system">
                                {fontLabel("system")}
                              </option>
                              <option value="sans">{fontLabel("sans")}</option>
                              <option value="serif">{fontLabel("serif")}</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="worksheet-footer-font" className="text-xs">
                              {copy.worksheetBrandingFooterFont}
                            </Label>
                            <select
                              id="worksheet-footer-font"
                              value={draft.footerFontFamily}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  footerFontFamily: event.target
                                    .value as WorksheetBrandingFontFamily,
                                }))
                              }
                              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                              <option value="system">
                                {fontLabel("system")}
                              </option>
                              <option value="sans">{fontLabel("sans")}</option>
                              <option value="serif">{fontLabel("serif")}</option>
                            </select>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>
                </ScrollArea>

                <div className="shrink-0 space-y-2">
                  <p className="text-[11px] font-medium text-muted-foreground">
                    {copy.worksheetBrandingPreview}
                  </p>
                  <div className="rounded-lg border bg-white p-4 text-[#181818] shadow-sm">
                    <WorksheetLetterheadHeader
                      branding={draft}
                      documentTitle={copy.worksheetBrandingPreviewDocTitle}
                      compact
                    />
                    <div className="my-3 h-8 rounded bg-muted/30" />
                    <WorksheetLetterheadFooter
                      branding={draft}
                      locale={locale}
                      pageLabel="1 / 3"
                    />
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      resetPrefs();
                      setDraft(adminDefaults);
                      toast.success(copy.worksheetBrandingReset);
                    }}
                  >
                    {copy.worksheetBrandingReset}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={onClose}
                  >
                    {copy.worksheetCancel}
                  </Button>
                  <Button type="button" className="flex-1" onClick={handleSave}>
                    {copy.worksheetSave}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}