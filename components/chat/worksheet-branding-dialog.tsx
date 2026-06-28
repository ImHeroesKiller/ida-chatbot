"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ImageIcon, Palette, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import {
  DEFAULT_WORKSHEET_BRANDING,
  readLogoFileAsDataUrl,
  useWorksheetBrandingPrefs,
  type WorksheetBrandingPrefs,
} from "@/lib/worksheet-branding-prefs";

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
  const [draft, setDraft] = useState<WorksheetBrandingPrefs>(prefs);

  useEffect(() => {
    if (open && hydrated) {
      setDraft(prefs);
    }
  }, [hydrated, open, prefs]);

  const handleSave = () => {
    updatePrefs({
      brandName: draft.brandName.trim() || DEFAULT_WORKSHEET_BRANDING.brandName,
      footerText:
        draft.footerText.trim() || DEFAULT_WORKSHEET_BRANDING.footerText,
      logoDataUrl: draft.logoDataUrl,
    });
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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md"
          >
            <Card className="shadow-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Palette className="h-4 w-4 text-primary" />
                  {copy.worksheetBrandingTitle}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {copy.worksheetBrandingDescription}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    placeholder={DEFAULT_WORKSHEET_BRANDING.brandName}
                    className="h-9 text-sm"
                  />
                </div>

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
                    placeholder={DEFAULT_WORKSHEET_BRANDING.footerText}
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

                <div className="flex gap-2">
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
      )}
    </AnimatePresence>
  );
}