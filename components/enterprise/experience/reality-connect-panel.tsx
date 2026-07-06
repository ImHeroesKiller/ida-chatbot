"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { CheckCircle2, FileUp, Loader2, Mail, Upload } from "lucide-react";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
import { useEnterpriseLocale } from "@/components/enterprise/i18n/enterprise-locale-provider";
import { formatApiError, parseApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

import { useEnterprise } from "./enterprise-context";

type SyncStatus = "idle" | "syncing" | "success" | "error";

type StatusMessage = {
  text: string;
  suggestion?: string;
  requestId?: string;
  tone: "success" | "error";
};

export function RealityConnectPanel() {
  const { refreshReality, reality } = useEnterprise();
  const { t } = useEnterpriseLocale();
  const fileRef = useRef<HTMLInputElement>(null);
  const [gmailStatus, setGmailStatus] = useState<SyncStatus>("idle");
  const [uploadStatus, setUploadStatus] = useState<SyncStatus>("idle");
  const [message, setMessage] = useState<StatusMessage | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const syncGmail = useCallback(
    async (useDemo = false) => {
      setGmailStatus("syncing");
      setMessage(null);
      try {
        const res = await fetch("/api/reality/gmail-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ useDemo }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          const err = parseApiError(data, "Gmail sync failed");
          throw Object.assign(new Error(formatApiError(err)), { parsed: err });
        }
        setGmailStatus("success");
        const count = data.emailCount ?? data.pipeline?.processed ?? 0;
        setMessage({
          tone: "success",
          text:
            data.source === "gmail"
              ? t("views", "importPanel.gmailImported", { count })
              : data.message ?? t("views", "importPanel.demoImported", { count }),
          requestId: data.requestId,
        });
        await refreshReality();
      } catch (e) {
        setGmailStatus("error");
        const parsed =
          e && typeof e === "object" && "parsed" in e
            ? (e as { parsed: ReturnType<typeof parseApiError> }).parsed
            : parseApiError(null, e instanceof Error ? e.message : "Gmail sync failed");
        setMessage({
          tone: "error",
          text: parsed.message,
          suggestion: parsed.suggestion,
          requestId: parsed.requestId,
        });
      }
    },
    [refreshReality, t],
  );

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (list.length === 0) return;

      setUploadStatus("syncing");
      setMessage(null);
      const form = new FormData();
      for (const file of list) form.append("files", file);

      try {
        const res = await fetch("/api/reality/upload", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok || !data.success) {
          const err = parseApiError(data, "Upload failed");
          throw Object.assign(new Error(formatApiError(err)), { parsed: err });
        }
        setUploadStatus("success");
        setMessage({
          tone: "success",
          text:
            data.uploaded > 1
              ? t("views", "importPanel.docsIndexedPlural", { count: data.uploaded })
              : t("views", "importPanel.docsIndexed", { count: data.uploaded }),
          requestId: data.requestId,
        });
        await refreshReality();
      } catch (e) {
        setUploadStatus("error");
        const parsed =
          e && typeof e === "object" && "parsed" in e
            ? (e as { parsed: ReturnType<typeof parseApiError> }).parsed
            : parseApiError(null, e instanceof Error ? e.message : "Upload failed");
        setMessage({
          tone: "error",
          text: parsed.message,
          suggestion: parsed.suggestion,
          requestId: parsed.requestId,
        });
      }
    },
    [refreshReality, t],
  );

  return (
    <EnterpriseGlassCard padding="lg" className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{t("views", "importPanel.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("views", "importPanel.description")}
        </p>
        {reality?.hasLiveData ? (
          <p className="mt-2 flex items-center gap-2 text-xs font-medium text-emerald-600">
            <CheckCircle2 className="size-3.5" />
            {t("views", "importPanel.liveActive", { count: reality.counts.communications })}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border/40 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Mail className="size-4 text-primary" />
            <h3 className="text-sm font-semibold">{t("views", "importPanel.gmailTitle")}</h3>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">
            {t("views", "importPanel.gmailDesc")}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                window.location.href = "/api/gmail/auth";
              }}
              className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t("views", "importPanel.connectGmail")}
            </button>
            <button
              type="button"
              onClick={() => syncGmail(true)}
              disabled={gmailStatus === "syncing"}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-4 text-xs font-medium transition-colors hover:bg-muted/50"
            >
              {gmailStatus === "syncing" ? <Loader2 className="size-3.5 animate-spin" /> : null}
              {t("views", "importPanel.loadDemo")}
            </button>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            {t("views", "importPanel.oauthSetup")}{" "}
            <Link href="/docs/setup/gmail" className="text-primary hover:underline">
              {t("views", "importPanel.gmailWizard")}
            </Link>
          </p>
        </div>

        <div
          className={cn(
            "rounded-xl border border-dashed p-4 transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-border/40",
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
          }}
        >
          <div className="mb-3 flex items-center gap-2">
            <FileUp className="size-4 text-primary" />
            <h3 className="text-sm font-semibold">{t("views", "importPanel.uploadTitle")}</h3>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">
            {t("views", "importPanel.uploadDesc")}
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploadStatus === "syncing"}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-4 text-xs font-medium transition-colors hover:bg-muted/50"
          >
            {uploadStatus === "syncing" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Upload className="size-3.5" />
            )}
            {t("views", "importPanel.uploadFiles")}
          </button>
          <p className="mt-3 text-[11px] text-muted-foreground">{t("views", "importPanel.maxSize")}</p>
        </div>
      </div>

      {message ? (
        <div
          className={cn(
            "space-y-1 rounded-lg px-3 py-2 text-xs",
            message.tone === "error"
              ? "bg-red-500/10 text-red-800"
              : "bg-emerald-500/10 text-emerald-800",
          )}
        >
          <p className="font-medium">{message.text}</p>
          {message.suggestion ? (
            <p className="opacity-90">{message.suggestion}</p>
          ) : null}
          {message.requestId && message.requestId !== "unknown" ? (
            <p className="font-mono opacity-75">Ref: {message.requestId}</p>
          ) : null}
        </div>
      ) : null}
    </EnterpriseGlassCard>
  );
}