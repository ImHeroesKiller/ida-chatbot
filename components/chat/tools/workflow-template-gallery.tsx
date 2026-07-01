"use client";

import {
  Award,
  BarChart3,
  Bookmark,
  Calendar,
  CheckCircle2,
  FileCheck,
  GraduationCap,
  Kanban,
  LayoutTemplate,
  MessageSquare,
  Package,
  Search,
  Server,
  Trash2,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import type { WorkflowTool } from "@/components/chat/tools/use-workflow";
import { WorkflowSaveTemplateDialog } from "@/components/chat/tools/workflow-save-template-dialog";
import { WorkflowTemplateApplyDialog } from "@/components/chat/tools/workflow-template-apply-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { WorkflowTemplateApplyMode } from "@/lib/workflow";
import {
  getBuiltinWorkflowTemplates,
  resolveWorkflowTemplate,
  searchWorkflowTemplates,
  workflowTemplateFromUserRecord,
  type WorkflowTemplate,
  type WorkflowTemplateCategory,
  type WorkflowTemplateIcon,
} from "@/lib/workflow-templates";
import type { UserWorkflowTemplateRecord } from "@/lib/workflow-templates-server";

const TEMPLATE_ICONS: Record<WorkflowTemplateIcon, typeof LayoutTemplate> = {
  onboarding: UserPlus,
  reporting: BarChart3,
  meeting: Calendar,
  project: Kanban,
  performance: Award,
  crm: Users,
  inventory: Package,
  training: GraduationCap,
  approval: CheckCircle2,
  standup: MessageSquare,
  tender: FileCheck,
  it: Server,
  custom: Bookmark,
};

function categoryLabel(
  copy: (typeof COPY)["id"],
  category: WorkflowTemplateCategory | "all",
): string {
  switch (category) {
    case "all":
      return copy.workflowTemplatesCategoryAll;
    case "hr":
      return copy.workflowTemplatesCategoryHr;
    case "operations":
      return copy.workflowTemplatesCategoryOperations;
    case "project-management":
      return copy.workflowTemplatesCategoryProjectManagement;
    case "reporting":
      return copy.workflowTemplatesCategoryReporting;
    case "sales-crm":
      return copy.workflowTemplatesCategorySalesCrm;
    case "it":
      return copy.workflowTemplatesCategoryIt;
    case "custom":
      return copy.workflowTemplatesCategoryCustom;
    default:
      return category;
  }
}

export interface WorkflowTemplateGalleryProps {
  locale: Locale;
  workflowTool: WorkflowTool;
  onApplied?: () => void;
}

export function WorkflowTemplateGallery({
  locale,
  workflowTool,
  onApplied,
}: WorkflowTemplateGalleryProps) {
  const copy = COPY[locale];
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<WorkflowTemplateCategory | "all">(
    "all",
  );
  const [userTemplates, setUserTemplates] = useState<WorkflowTemplate[]>([]);
  const [loadingUser, setLoadingUser] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<WorkflowTemplate | null>(
    null,
  );
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const loadUserTemplates = useCallback(async () => {
    setLoadingUser(true);
    try {
      const response = await fetch("/api/workflow/templates", {
        cache: "no-store",
      });
      if (response.status === 401) {
        setUserTemplates([]);
        return;
      }
      if (!response.ok) return;

      const data = (await response.json()) as {
        templates?: UserWorkflowTemplateRecord[];
      };
      const mapped = (data.templates ?? []).map((record) =>
        workflowTemplateFromUserRecord({
          id: record.id,
          name: record.name,
          description: record.description,
          category: record.category,
          definition: record.definition,
        }),
      );
      setUserTemplates(mapped);
    } catch {
      setUserTemplates([]);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    void loadUserTemplates();
  }, [loadUserTemplates]);

  const allTemplates = useMemo(
    () => [...getBuiltinWorkflowTemplates(), ...userTemplates],
    [userTemplates],
  );

  const filteredTemplates = useMemo(() => {
    let templates = searchWorkflowTemplates(allTemplates, locale, query);
    if (category !== "all") {
      templates = templates.filter((template) => template.category === category);
    }
    return templates;
  }, [allTemplates, category, locale, query]);

  const categories = useMemo(() => {
    const set = new Set<WorkflowTemplateCategory>();
    for (const template of allTemplates) {
      set.add(template.category);
    }
    return ["all", ...Array.from(set)] as Array<
      WorkflowTemplateCategory | "all"
    >;
  }, [allTemplates]);

  const handleApply = useCallback(
    (template: WorkflowTemplate, mode: WorkflowTemplateApplyMode) => {
      const applied = workflowTool.applyTemplate(template, { locale, mode });
      if (!applied) {
        toast.error(copy.workflowTemplateImportFailed);
        return;
      }
      toast.success(copy.workflowTemplateApplied);
      setPendingTemplate(null);
      onApplied?.();
    },
    [
      copy.workflowTemplateApplied,
      copy.workflowTemplateImportFailed,
      locale,
      onApplied,
      workflowTool,
    ],
  );

  const handleDeleteUserTemplate = useCallback(
    async (templateId: string) => {
      try {
        const response = await fetch(`/api/workflow/templates/${templateId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          toast.error(copy.workflowTemplateDeleteFailed);
          return;
        }
        toast.success(copy.workflowTemplateDeleted);
        await loadUserTemplates();
      } catch {
        toast.error(copy.workflowTemplateDeleteFailed);
      }
    },
    [
      copy.workflowTemplateDeleteFailed,
      copy.workflowTemplateDeleted,
      loadUserTemplates,
    ],
  );

  const handleExport = useCallback(() => {
    const json = workflowTool.exportActiveWorkflowJson();
    if (!json) return;

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const slug =
      workflowTool.activeWorkflow?.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "workflow";
    anchor.href = url;
    anchor.download = `${slug}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success(copy.workflowTemplateExported);
  }, [copy.workflowTemplateExported, workflowTool]);

  const handleImportFile = useCallback(
    async (file: File) => {
      try {
        const raw = await file.text();
        const imported = workflowTool.importWorkflowJson(raw, { mode: "append" });
        if (!imported) {
          toast.error(copy.workflowTemplateImportFailed);
          return;
        }
        toast.success(copy.workflowTemplateImported);
        onApplied?.();
      } catch {
        toast.error(copy.workflowTemplateImportFailed);
      }
    },
    [
      copy.workflowTemplateImportFailed,
      copy.workflowTemplateImported,
      onApplied,
      workflowTool,
    ],
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-2 border-b px-3 py-2">
        <div>
          <p className="text-sm font-semibold">{copy.workflowTemplatesTitle}</p>
          <p className="text-[11px] text-muted-foreground">
            {copy.workflowTemplatesDescription}
          </p>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.workflowTemplatesSearch}
            className="h-8 pl-8 text-xs"
          />
        </div>

        <div className="flex flex-wrap gap-1">
          {categories.map((item) => (
            <Button
              key={item}
              type="button"
              size="xs"
              variant={category === item ? "default" : "outline"}
              className="h-6 px-2 text-[10px]"
              onClick={() => setCategory(item)}
            >
              {categoryLabel(copy, item)}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            size="xs"
            variant="outline"
            className="h-7 text-[10px]"
            onClick={() => setSaveDialogOpen(true)}
            disabled={!workflowTool.activeWorkflow}
          >
            <Bookmark className="mr-1 h-3 w-3" />
            {copy.workflowTemplateSave}
          </Button>
          <Button
            type="button"
            size="xs"
            variant="outline"
            className="h-7 text-[10px]"
            onClick={handleExport}
            disabled={!workflowTool.activeWorkflow}
          >
            {copy.workflowTemplateExport}
          </Button>
          <Button
            type="button"
            size="xs"
            variant="outline"
            className="h-7 text-[10px]"
            onClick={() => importInputRef.current?.click()}
          >
            <Upload className="mr-1 h-3 w-3" />
            {copy.workflowTemplateImport}
          </Button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleImportFile(file);
              event.target.value = "";
            }}
          />
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <ul className="space-y-2 p-3">
          {filteredTemplates.length === 0 ? (
            <li className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
              {loadingUser
                ? "…"
                : copy.workflowTemplateNoResults}
            </li>
          ) : (
            filteredTemplates.map((template) => {
              const resolved = resolveWorkflowTemplate(template, locale);
              const Icon = TEMPLATE_ICONS[template.icon] ?? LayoutTemplate;
              const isUser = template.source === "user";

              return (
                <li
                  key={`${template.source}-${template.id}`}
                  className="rounded-xl border bg-card p-3 shadow-sm"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-medium">{resolved.title}</p>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">
                          {categoryLabel(copy, template.category)}
                        </span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">
                          {isUser
                            ? copy.workflowTemplateCustom
                            : copy.workflowTemplateBuiltin}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {resolved.description}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {resolved.nodes.length} nodes · {resolved.edges.length}{" "}
                        edges
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Button
                      type="button"
                      size="xs"
                      className="h-7 text-[10px]"
                      onClick={() => setPendingTemplate(template)}
                    >
                      {copy.workflowTemplateUse}
                    </Button>
                    {isUser ? (
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        className="h-7 text-[10px] text-destructive hover:text-destructive"
                        onClick={() => void handleDeleteUserTemplate(template.id)}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        {copy.workflowTemplateDelete}
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </ScrollArea>

      <WorkflowTemplateApplyDialog
        open={Boolean(pendingTemplate)}
        locale={locale}
        templateTitle={
          pendingTemplate
            ? resolveWorkflowTemplate(pendingTemplate, locale).title
            : ""
        }
        hasActiveWorkflow={Boolean(workflowTool.activeWorkflow?.nodes.length)}
        onApply={(mode) => {
          if (pendingTemplate) handleApply(pendingTemplate, mode);
        }}
        onClose={() => setPendingTemplate(null)}
      />

      <WorkflowSaveTemplateDialog
        open={saveDialogOpen}
        locale={locale}
        workflow={workflowTool.activeWorkflow}
        onClose={() => setSaveDialogOpen(false)}
        onSaved={() => void loadUserTemplates()}
      />
    </div>
  );
}