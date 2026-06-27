"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  FileText,
  Loader2,
  Shield,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import { AgentGraphProgress } from "@/components/agent/agent-graph-progress";
import { AgentMermaid } from "@/components/agent/agent-mermaid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AGENT_COPY } from "@/lib/agent/content";
import { AGENTFLOW_TECH_STACK } from "@/lib/agent/spec-diagram";
import type {
  AgentApiDocumentPayload,
  AgentWorkflowRun,
  AgentWorkflowStep,
} from "@/lib/agent/types";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

interface PendingFile {
  id: string;
  file: File;
}

interface AgentWorkspaceProps {
  locale: keyof typeof AGENT_COPY;
  run: AgentWorkflowRun | null;
  loading: boolean;
  executing: boolean;
  onAnalyze: (
    instruction: string,
    documents: AgentApiDocumentPayload[],
  ) => Promise<void>;
  onApprove: () => Promise<void>;
  onUploadTemplates: (
    templates: Array<{
      fileName: string;
      fileType: "docx" | "pdf";
      base64: string;
      sizeBytes: number;
    }>,
  ) => Promise<void>;
  onExecute: () => Promise<void>;
  onCancel: () => Promise<void>;
  onEditWorkflow: (steps: AgentWorkflowStep[]) => Promise<void>;
}

function detectFileType(file: File): "pdf" | "docx" | "xlsx" | null {
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".docx")) return "docx";
  if (lower.endsWith(".xlsx")) return "xlsx";
  return null;
}

function readFileBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Failed to read file."));
        return;
      }
      const base64 = result.split(",")[1];
      if (!base64) {
        reject(new Error("Invalid file data."));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

function StepIcon({ status }: { status: string }) {
  if (status === "done")
    return <CheckCircle2 className="size-4 text-green-600" />;
  if (status === "running")
    return <Loader2 className="size-4 animate-spin text-primary" />;
  if (status === "error")
    return <AlertTriangle className="size-4 text-destructive" />;
  return <Circle className="size-4 text-muted-foreground/50" />;
}

export function AgentWorkspace({
  locale,
  run,
  loading,
  executing,
  onAnalyze,
  onApprove,
  onUploadTemplates,
  onExecute,
  onCancel,
  onEditWorkflow,
}: AgentWorkspaceProps) {
  const copy = AGENT_COPY[locale];
  const [instruction, setInstruction] = useState(run?.instruction ?? "");
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [editing, setEditing] = useState(false);
  const [editSteps, setEditSteps] = useState<AgentWorkflowStep[]>([]);
  const [pendingTemplates, setPendingTemplates] = useState<PendingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (run?.instruction) {
      setInstruction(run.instruction);
    } else if (!run) {
      setInstruction("");
      setPendingFiles([]);
      setEditing(false);
    }
  }, [run?.id, run?.instruction, run]);

  const showResults = Boolean(run?.analysis || run?.proposal);
  const canApprove =
    run?.status === "awaiting_approval" || run?.status === "proposed";
  const canUploadTemplates = run?.status === "awaiting_templates";
  const canExecute = run?.status === "approved";
  const isCompleted = run?.status === "completed";
  const isCancelled = run?.status === "cancelled";

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const next: PendingFile[] = [];

      for (const file of Array.from(files)) {
        if (file.size > MAX_FILE_SIZE) {
          toast.error(copy.uploadTooLarge);
          continue;
        }

        const fileType = detectFileType(file);
        if (!fileType && !ACCEPTED_TYPES.has(file.type)) {
          toast.error(copy.uploadUnsupported);
          continue;
        }

        next.push({
          id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          file,
        });
      }

      setPendingFiles((prev) => [...prev, ...next].slice(0, 10));
    },
    [copy.uploadTooLarge, copy.uploadUnsupported],
  );

  const handleAnalyze = async () => {
    if (!instruction.trim()) return;

    try {
      const documents: AgentApiDocumentPayload[] = await Promise.all(
        pendingFiles.map(async (item) => {
          const fileType = detectFileType(item.file);
          if (!fileType) throw new Error(copy.uploadUnsupported);
          return {
            fileName: item.file.name,
            fileType,
            base64: await readFileBase64(item.file),
            sizeBytes: item.file.size,
          };
        }),
      );

      await onAnalyze(instruction.trim(), documents);
      setPendingFiles([]);
    } catch {
      toast.error(copy.uploadError);
    }
  };

  const startEdit = () => {
    if (!run?.proposal) return;
    setEditSteps(run.proposal.steps.map((step) => ({ ...step })));
    setEditing(true);
  };

  const saveEdit = async () => {
    await onEditWorkflow(editSteps);
    setEditing(false);
  };

  const copyArtifact = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success(copy.downloadArtifact);
    } catch {
      toast.error(copy.apiError);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight sm:text-xl">
                {copy.title}
              </h1>
              <Badge variant="outline" className="gap-1">
                <Shield className="size-3" aria-hidden />
                {copy.sandboxBadge}
              </Badge>
              <Badge variant="secondary" className="gap-1">
                {copy.e2bBadge}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
            {run?.correlationId && (
              <p className="font-mono text-[10px] text-muted-foreground">
                {copy.correlationIdLabel}: {run.correlationId}
              </p>
            )}
          </div>
        </div>
        <p className="mt-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
          <Shield className="mr-1 inline size-3.5 text-primary" aria-hidden />
          {copy.sandboxNotice}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <Card size="sm">
            <CardHeader>
              <CardTitle className="text-sm">{copy.techStackTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 sm:grid-cols-2">
                {AGENTFLOW_TECH_STACK.map((item) => (
                  <li
                    key={item.layer}
                    className="rounded-lg border bg-muted/20 px-3 py-2 text-xs"
                  >
                    <p className="font-medium">{item.layer}</p>
                    <p className="text-primary">{item.tech}</p>
                    <p className="text-muted-foreground">{item.role}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {run && (
            <AgentGraphProgress run={run} title={copy.graphProgressTitle} />
          )}

          {!showResults && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {copy.instructionLabel}
                </CardTitle>
                <CardDescription>{copy.uploadHint}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={instruction}
                  onChange={(event) => setInstruction(event.target.value)}
                  placeholder={copy.instructionPlaceholder}
                  className="min-h-[160px] resize-y text-sm"
                  disabled={loading}
                />

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                    >
                      <Upload className="size-4" />
                      {copy.uploadLabel}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.docx,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      className="hidden"
                      onChange={(event) => {
                        handleFiles(event.target.files);
                        event.target.value = "";
                      }}
                    />
                  </div>

                  {pendingFiles.length > 0 && (
                    <ul className="space-y-2">
                      {pendingFiles.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm"
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <FileText className="size-4 shrink-0 text-primary" />
                            <span className="truncate">{item.file.name}</span>
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() =>
                              setPendingFiles((prev) =>
                                prev.filter((f) => f.id !== item.id),
                              )
                            }
                          >
                            <X className="size-3.5" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <Button
                  type="button"
                  size="lg"
                  className="w-full gap-2 sm:w-auto"
                  onClick={() => void handleAnalyze()}
                  disabled={loading || !instruction.trim()}
                >
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  {loading ? copy.analyzing : copy.analyzeButton}
                </Button>
              </CardContent>
            </Card>
          )}

          {run?.analysis && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{copy.analysisTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p className="leading-relaxed text-muted-foreground">
                  {run.analysis.summary}
                </p>

                <div className="flex flex-wrap gap-2">
                  <Badge variant={run.analysis.ragContextUsed ? "default" : "secondary"}>
                    {run.analysis.ragContextUsed ? copy.ragUsed : copy.ragNotUsed}
                  </Badge>
                </div>

                {run.analysis.documentTypes.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                      {copy.documentTypesLabel}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {run.analysis.documentTypes.map((type) => (
                        <Badge key={type} variant="outline">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {run.analysis.ruleBasedChecks.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                      {copy.ruleChecksLabel}
                    </p>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {run.analysis.ruleBasedChecks.map((check) => (
                        <li key={check}>• {check}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {run.analysis.keyEntities.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                      {copy.entitiesLabel}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {run.analysis.keyEntities.map((entity) => (
                        <Badge key={entity} variant="outline">
                          {entity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {run.documents.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      {copy.validationLabel}
                    </p>
                    <ul className="space-y-2">
                      {run.documents.map((doc) => (
                        <li
                          key={doc.id}
                          className="rounded-lg border px-3 py-2 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">{doc.fileName}</span>
                            <Badge
                              variant={
                                doc.validationStatus === "valid"
                                  ? "default"
                                  : doc.validationStatus === "warning"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {doc.validationStatus}
                            </Badge>
                          </div>
                          <p className="mt-1 text-muted-foreground">
                            {doc.extractedPreview}
                          </p>
                          {doc.validationNotes.map((note) => (
                            <p
                              key={note}
                              className="mt-1 text-[11px] text-amber-600 dark:text-amber-400"
                            >
                              {note}
                            </p>
                          ))}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {run?.proposal && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{copy.proposalTitle}</CardTitle>
                <CardDescription>
                  {run.proposal.summary}
                  {run.proposal.estimatedTotalMinutes > 0 && (
                    <span className="mt-1 block text-xs">
                      {copy.estimatedDuration}: ~{run.proposal.estimatedTotalMinutes}{" "}
                      {copy.minutesShort}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {editing ? (
                  <div className="space-y-3">
                    {editSteps.map((step, index) => (
                      <div key={step.id} className="space-y-2 rounded-lg border p-3">
                        <Textarea
                          value={step.title}
                          onChange={(event) => {
                            const next = [...editSteps];
                            next[index] = { ...step, title: event.target.value };
                            setEditSteps(next);
                          }}
                          className="min-h-0 text-sm font-medium"
                          rows={1}
                        />
                        <Textarea
                          value={step.description}
                          onChange={(event) => {
                            const next = [...editSteps];
                            next[index] = {
                              ...step,
                              description: event.target.value,
                            };
                            setEditSteps(next);
                          }}
                          className="text-sm"
                          rows={2}
                        />
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Button type="button" size="sm" onClick={() => void saveEdit()}>
                        {copy.editSave}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditing(false)}
                      >
                        {copy.editCancel}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <ol className="space-y-3">
                    {run.proposal.steps.map((step) => (
                      <li
                        key={step.id}
                        className="flex gap-3 rounded-xl border bg-card/50 p-4"
                      >
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {step.order}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{step.title}</p>
                            {step.requiresApproval && (
                              <Badge variant="outline" className="text-[10px]">
                                {copy.stepApproval}
                              </Badge>
                            )}
                            {step.toolCategory && (
                              <Badge variant="secondary" className="text-[10px]">
                                {step.toolCategory}
                              </Badge>
                            )}
                            {step.estimatedDurationMinutes != null && (
                              <Badge variant="ghost" className="text-[10px]">
                                ~{step.estimatedDurationMinutes} {copy.minutesShort}
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {step.description}
                          </p>
                          {step.leadTimeType && step.leadTimeType !== "none" && (
                            <p className="mt-1 text-[10px] text-amber-600 dark:text-amber-400">
                              Lead time: {step.leadTimeType}
                            </p>
                          )}
                          {step.agent && (
                            <p className="mt-1 font-mono text-[10px] text-muted-foreground/70">
                              {step.agent}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}

                {run.proposal.branches.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium">{copy.branchesTitle}</p>
                    <ul className="space-y-2">
                      {run.proposal.branches.map((branch) => (
                        <li
                          key={branch.id}
                          className="rounded-lg border bg-muted/20 px-3 py-2 text-xs"
                        >
                          <p className="font-medium">{branch.label}</p>
                          {branch.condition && (
                            <p className="text-muted-foreground">
                              if {branch.condition}
                            </p>
                          )}
                          <p className="text-muted-foreground">
                            {branch.stepIds.length} steps
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <AgentMermaid
                  diagram={run.proposal.mermaidDiagram}
                  title={copy.mermaidTitle}
                />

                {run.proposal.placeholders.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium">
                      {copy.placeholdersTitle}
                    </p>
                    {run.proposal.placeholders.map((template) => (
                      <div
                        key={template.templateName}
                        className="rounded-lg border bg-muted/20 p-3 text-xs"
                      >
                        <p className="mb-2 font-mono font-medium">
                          {template.templateName}
                        </p>
                        <ul className="space-y-1.5">
                          {template.placeholders.map((ph) => (
                            <li key={ph.key} className="flex flex-wrap gap-2">
                              <code className="rounded bg-muted px-1.5 py-0.5">
                                {ph.key}
                              </code>
                              <span className="text-muted-foreground">
                                → {ph.value.slice(0, 80)}
                                {ph.value.length > 80 ? "…" : ""}
                              </span>
                              <span className="text-[10px] text-muted-foreground/70">
                                ({ph.source})
                              </span>
                              {"fidelityOk" in ph && (
                                <Badge
                                  variant={ph.fidelityOk ? "default" : "secondary"}
                                  className="text-[9px]"
                                >
                                  {copy.fidelityLabel}: {ph.fidelityOk ? "OK" : "?"}
                                </Badge>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {canUploadTemplates && (
                  <div className="space-y-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
                    <p className="text-sm font-medium">{copy.templateUploadLabel}</p>
                    <p className="text-xs text-muted-foreground">
                      {copy.templateUploadHint}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => templateInputRef.current?.click()}
                      disabled={loading}
                    >
                      <Upload className="size-4" />
                      {copy.templateUploadLabel}
                    </Button>
                    <input
                      ref={templateInputRef}
                      type="file"
                      multiple
                      accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="hidden"
                      onChange={(event) => {
                        const files = event.target.files;
                        if (!files) return;
                        const next: PendingFile[] = [];
                        for (const file of Array.from(files)) {
                          const lower = file.name.toLowerCase();
                          if (
                            !lower.endsWith(".docx") &&
                            !lower.endsWith(".pdf")
                          ) {
                            toast.error(copy.uploadUnsupported);
                            continue;
                          }
                          next.push({
                            id: `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                            file,
                          });
                        }
                        setPendingTemplates((prev) =>
                          [...prev, ...next].slice(0, 5),
                        );
                        event.target.value = "";
                      }}
                    />
                    {pendingTemplates.length > 0 && (
                      <ul className="space-y-2">
                        {pendingTemplates.map((item) => (
                          <li
                            key={item.id}
                            className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                          >
                            <span className="truncate">{item.file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() =>
                                setPendingTemplates((prev) =>
                                  prev.filter((f) => f.id !== item.id),
                                )
                              }
                            >
                              <X className="size-3.5" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      disabled={loading || pendingTemplates.length === 0}
                      onClick={() =>
                        void (async () => {
                          try {
                            const templates = await Promise.all(
                              pendingTemplates.map(async (item) => {
                                const lower = item.file.name.toLowerCase();
                                return {
                                  fileName: item.file.name,
                                  fileType: lower.endsWith(".pdf")
                                    ? ("pdf" as const)
                                    : ("docx" as const),
                                  base64: await readFileBase64(item.file),
                                  sizeBytes: item.file.size,
                                };
                              }),
                            );
                            await onUploadTemplates(templates);
                            setPendingTemplates([]);
                          } catch {
                            toast.error(copy.uploadError);
                          }
                        })()
                      }
                    >
                      {copy.injectTemplatesButton}
                    </Button>
                  </div>
                )}

                {!isCompleted && !isCancelled && (
                  <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:flex-wrap">
                    {canApprove && (
                      <Button
                        type="button"
                        className="gap-2"
                        onClick={() => void onApprove()}
                        disabled={loading || executing}
                      >
                        <CheckCircle2 className="size-4" />
                        {copy.approveWorkflow}
                      </Button>
                    )}
                    {canExecute && (
                      <Button
                        type="button"
                        className="gap-2"
                        onClick={() => void onExecute()}
                        disabled={loading || executing}
                      >
                        {executing ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Sparkles className="size-4" />
                        )}
                        {executing ? copy.executing : copy.approveExecute}
                      </Button>
                    )}
                    {canApprove && (
                      <p className="w-full text-xs text-muted-foreground">
                        {copy.approveFirst}
                      </p>
                    )}
                    {canUploadTemplates && (
                      <p className="w-full text-xs text-muted-foreground">
                        {copy.templateUploadHint}
                      </p>
                    )}
                    {!editing && canApprove && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={startEdit}
                        disabled={loading || executing}
                      >
                        {copy.editWorkflow}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => void onCancel()}
                      disabled={loading || executing}
                    >
                      {copy.cancel}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {(run?.executionSteps.length ?? 0) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{copy.executionTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {run!.executionSteps.map((step) => (
                    <li
                      key={step.stepId}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm",
                        step.status === "running" && "border-primary/30 bg-primary/5",
                      )}
                    >
                      <StepIcon status={step.status} />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{step.title}</p>
                        {step.output && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {step.output}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {(run?.auditLogs.length ?? 0) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{copy.auditLogTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="max-h-48 space-y-2 overflow-y-auto text-xs">
                  {run!.auditLogs.map((entry) => (
                    <li
                      key={entry.id}
                      className="rounded-lg border bg-muted/20 px-3 py-2 font-mono"
                    >
                      <span className="text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>{" "}
                      [{entry.actor}] {entry.node}: {entry.action}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {(run?.notifications.length ?? 0) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{copy.notificationTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {run!.notifications.map((notif) => (
                    <li
                      key={notif.id}
                      className="rounded-lg border px-3 py-2 text-muted-foreground"
                    >
                      {notif.message}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {(run?.artifacts.length ?? 0) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{copy.artifactsTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {run!.artifacts.map((artifact) => (
                  <div
                    key={artifact.id}
                    className="rounded-xl border bg-muted/20 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{artifact.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {artifact.summary}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void copyArtifact(artifact.content)}
                      >
                        {copy.downloadArtifact}
                      </Button>
                    </div>
                    <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-background p-3 font-mono text-[11px] leading-relaxed">
                      {artifact.content}
                    </pre>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}