"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Eye, ImageIcon, Palette, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import {
  DEFAULT_WORKSHEET_BRANDING_CONFIG,
  parseWorksheetBrandingConfig,
  type WorksheetBrandingConfig,
  type WorksheetBrandingFontFamily,
} from "@/lib/worksheet-branding-config";
import { WorksheetLetterheadTemplatePicker } from "@/components/chat/worksheet-template-picker";
import { readLogoFileAsDataUrl } from "@/lib/worksheet-branding-prefs";
import {
  findDefaultLetterheadTemplate,
  findLetterheadTemplateById,
  type WorksheetLetterheadSelection,
  type WorksheetLetterheadTemplate,
} from "@/lib/worksheet-letterhead-template";
import { WORKSHEET_MODAL_OVERLAY_CLASS } from "@/lib/worksheet-overlay";
import { cn } from "@/lib/utils";

type BrandingTab = "header" | "footer" | "styling" | "preview";

interface WorksheetBrandingDialogProps {
  open: boolean;
  locale: Locale;
  selection: WorksheetLetterheadSelection;
  templates: WorksheetLetterheadTemplate[];
  templatesHydrated: boolean;
  activeTemplateName?: string | null;
  previewBranding: WorksheetBrandingConfig;
  prefs: WorksheetBrandingConfig;
  adminDefaults: WorksheetBrandingConfig;
  prefsHydrated: boolean;
  onUpdatePrefs: (prefs: WorksheetBrandingConfig) => void;
  onResetPrefs: () => void;
  onSelectionChange: (selection: WorksheetLetterheadSelection) => void;
  onClose: () => void;
}

function BrandingFormSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "space-y-4 border-b border-border/60 pb-5 last:border-b-0 last:pb-0",
        className,
      )}
    >
      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function BrandingField({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs font-medium">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function WorksheetBrandingDialog({
  open,
  locale,
  selection,
  templates,
  templatesHydrated,
  activeTemplateName,
  previewBranding,
  prefs,
  adminDefaults,
  prefsHydrated,
  onUpdatePrefs,
  onResetPrefs,
  onSelectionChange,
  onClose,
}: WorksheetBrandingDialogProps) {
  const copy = COPY[locale];
  const didInitializeRef = useRef(false);
  const [draft, setDraft] = useState<WorksheetBrandingConfig>(prefs);
  const [draftSelection, setDraftSelection] =
    useState<WorksheetLetterheadSelection>(selection);
  const [tab, setTab] = useState<BrandingTab>("header");
  const isTemplateMode = draftSelection.brandingSource === "template";
  const draftTemplate = useMemo(() => {
    if (!isTemplateMode) return null;
    return (
      findLetterheadTemplateById(templates, draftSelection.letterheadTemplateId) ??
      findDefaultLetterheadTemplate(templates)
    );
  }, [draftSelection.letterheadTemplateId, isTemplateMode, templates]);
  const previewConfig = isTemplateMode
    ? (draftTemplate?.brandingConfig ?? previewBranding)
    : draft;

  useEffect(() => {
    if (!open) {
      didInitializeRef.current = false;
      return;
    }

    if (!prefsHydrated || didInitializeRef.current) return;

    setDraft(prefs);
    setDraftSelection(selection);
    setTab(selection.brandingSource === "template" ? "preview" : "header");
    didInitializeRef.current = true;
  }, [open, prefs, prefsHydrated, selection]);

  useEffect(() => {
    if (isTemplateMode && tab !== "preview") {
      setTab("preview");
    }
  }, [isTemplateMode, tab]);

  const handleSave = () => {
    if (!isTemplateMode) {
      onUpdatePrefs(parseWorksheetBrandingConfig(draft));
      toast.success(copy.worksheetBrandingSaved);
    } else {
      toast.success(copy.worksheetBrandingSelectionSaved);
    }
    onSelectionChange(draftSelection);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const handleReset = () => {
    onResetPrefs();
    setDraft(adminDefaults);
    toast.success(copy.worksheetBrandingReset);
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
            "fixed inset-0 flex items-center justify-center bg-black/50 p-4 sm:p-6",
            WORKSHEET_MODAL_OVERLAY_CLASS,
          )}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[min(92vh,44rem)] min-h-0 w-full max-w-2xl flex-col overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label={copy.worksheetBrandingTitle}
          >
            <Card className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden py-0 shadow-2xl">
              <CardHeader className="shrink-0 space-y-3 border-b px-6 pt-6 pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Palette className="h-4 w-4 text-primary" />
                  {copy.worksheetBrandingTitle}
                </CardTitle>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {copy.worksheetBrandingDescription}
                </p>
                <div className="flex flex-wrap gap-1 rounded-lg border bg-muted/20 p-1">
                  {!isTemplateMode ? (
                    <>
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
                    </>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    className={tabButtonClass("preview")}
                    onClick={() => setTab("preview")}
                  >
                    <Eye className="mr-1 h-3.5 w-3.5" />
                    {copy.worksheetBrandingTabPreview}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
                <div className="h-0 min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
                  <div className="space-y-5 px-6 py-5">
                    <WorksheetLetterheadTemplatePicker
                      locale={locale}
                      templates={templates}
                      selection={draftSelection}
                      activeTemplateName={
                        draftTemplate?.name ?? activeTemplateName
                      }
                      loading={!templatesHydrated}
                      onSelectionChange={setDraftSelection}
                    />

                    {isTemplateMode ? (
                      <p className="rounded-lg border border-dashed bg-muted/20 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
                        {copy.worksheetBrandingTemplateReadOnly}
                      </p>
                    ) : null}

                    {!isTemplateMode && tab === "header" ? (
                      <>
                        <BrandingFormSection title={copy.worksheetBrandingLetterheadSection}>
                          <BrandingField
                            id="worksheet-brand-name"
                            label={copy.worksheetBrandingBrandName}
                          >
                            <Input
                              id="worksheet-brand-name"
                              value={draft.brandName}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  brandName: event.target.value,
                                }))
                              }
                              placeholder={
                                DEFAULT_WORKSHEET_BRANDING_CONFIG.brandName
                              }
                              className="h-9 text-sm"
                            />
                          </BrandingField>

                          <BrandingField
                            id="worksheet-brand-tagline"
                            label={copy.worksheetBrandingTagline}
                          >
                            <Input
                              id="worksheet-brand-tagline"
                              value={draft.tagline}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  tagline: event.target.value,
                                }))
                              }
                              placeholder={
                                copy.worksheetBrandingTaglinePlaceholder
                              }
                              className="h-9 text-sm"
                            />
                          </BrandingField>

                          <BrandingField
                            id="worksheet-brand-logo"
                            label={copy.worksheetBrandingLogo}
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
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
                                    void handleLogoChange(
                                      event.target.files?.[0],
                                    )
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
                          </BrandingField>
                        </BrandingFormSection>

                        <BrandingFormSection title={copy.worksheetBrandingContactSection}>
                          <BrandingField
                            id="worksheet-brand-address"
                            label={copy.worksheetBrandingAddress}
                          >
                            <Textarea
                              id="worksheet-brand-address"
                              value={draft.address}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  address: event.target.value,
                                }))
                              }
                              placeholder={
                                copy.worksheetBrandingAddressPlaceholder
                              }
                              className="min-h-20 max-h-36 resize-y overflow-y-auto text-sm"
                              spellCheck={false}
                            />
                          </BrandingField>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <BrandingField
                              id="worksheet-brand-phone"
                              label={copy.worksheetBrandingPhone}
                            >
                              <Input
                                id="worksheet-brand-phone"
                                value={draft.phone}
                                onChange={(event) =>
                                  setDraft((current) => ({
                                    ...current,
                                    phone: event.target.value,
                                  }))
                                }
                                placeholder={
                                  copy.worksheetBrandingPhonePlaceholder
                                }
                                className="h-9 text-sm"
                              />
                            </BrandingField>
                            <BrandingField
                              id="worksheet-brand-email"
                              label={copy.worksheetBrandingEmail}
                            >
                              <Input
                                id="worksheet-brand-email"
                                value={draft.email}
                                onChange={(event) =>
                                  setDraft((current) => ({
                                    ...current,
                                    email: event.target.value,
                                  }))
                                }
                                placeholder={
                                  copy.worksheetBrandingEmailPlaceholder
                                }
                                className="h-9 text-sm"
                              />
                            </BrandingField>
                          </div>

                          <BrandingField
                            id="worksheet-brand-website"
                            label={copy.worksheetBrandingWebsite}
                          >
                            <Input
                              id="worksheet-brand-website"
                              value={draft.website}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  website: event.target.value,
                                }))
                              }
                              placeholder={
                                copy.worksheetBrandingWebsitePlaceholder
                              }
                              className="h-9 text-sm"
                            />
                          </BrandingField>
                        </BrandingFormSection>

                        <BrandingFormSection title={copy.worksheetBrandingTabStyling}>
                          <label className="flex items-center gap-2.5 rounded-lg border bg-muted/20 px-3 py-2.5 text-xs text-foreground">
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
                        </BrandingFormSection>
                      </>
                    ) : null}

                    {!isTemplateMode && tab === "footer" ? (
                      <BrandingFormSection title={copy.worksheetBrandingFooterSection}>
                        <BrandingField
                          id="worksheet-footer-text"
                          label={copy.worksheetBrandingFooterText}
                        >
                          <Input
                            id="worksheet-footer-text"
                            value={draft.footerText}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                footerText: event.target.value,
                              }))
                            }
                            placeholder={
                              DEFAULT_WORKSHEET_BRANDING_CONFIG.footerText
                            }
                            className="h-9 text-sm"
                          />
                        </BrandingField>

                        <BrandingField
                          id="worksheet-footer-contact"
                          label={copy.worksheetBrandingFooterContact}
                        >
                          <Input
                            id="worksheet-footer-contact"
                            value={draft.footerContactLine}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                footerContactLine: event.target.value,
                              }))
                            }
                            placeholder={
                              copy.worksheetBrandingFooterContactPlaceholder
                            }
                            className="h-9 text-sm"
                          />
                        </BrandingField>
                      </BrandingFormSection>
                    ) : null}

                    {!isTemplateMode && tab === "styling" ? (
                      <BrandingFormSection title={copy.worksheetBrandingTabStyling}>
                        <BrandingField
                          id="worksheet-primary-color"
                          label={copy.worksheetBrandingPrimaryColor}
                        >
                          <div className="flex items-center gap-3">
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
                        </BrandingField>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <BrandingField
                            id="worksheet-header-font"
                            label={copy.worksheetBrandingHeaderFont}
                          >
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
                          </BrandingField>
                          <BrandingField
                            id="worksheet-footer-font"
                            label={copy.worksheetBrandingFooterFont}
                          >
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
                          </BrandingField>
                        </div>
                      </BrandingFormSection>
                    ) : null}

                    {tab === "preview" ? (
                      <div className="space-y-4">
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {copy.worksheetBrandingPreviewHint}
                        </p>
                        <div className="mx-auto w-full max-w-md rounded-xl border bg-white p-5 text-[#181818] shadow-sm">
                          <p className="mb-3 text-[10px] font-medium tracking-wide text-[#888] uppercase">
                            {copy.worksheetBrandingPreview}
                          </p>
                          <WorksheetLetterheadHeader
                            branding={previewConfig}
                            documentTitle={copy.worksheetBrandingPreviewDocTitle}
                            compact
                          />
                          <div
                            aria-hidden
                            className="my-4 h-9 rounded-md border border-dashed border-[#ddd] bg-[#f7f7f7]"
                          />
                          <WorksheetLetterheadFooter
                            branding={previewConfig}
                            locale={locale}
                            pageLabel="1 / 3"
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 gap-2 border-t bg-muted/10 px-6 py-4">
                  {!isTemplateMode ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={handleReset}
                    >
                      {copy.worksheetBrandingReset}
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleCancel}
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