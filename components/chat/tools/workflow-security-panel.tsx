"use client";

import { Shield } from "lucide-react";
import { memo, useCallback, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import {
  WORKFLOW_ROLE_LABELS,
  WORKFLOW_VISIBILITY_LABELS,
  type WorkflowVisibility,
} from "@/lib/workflow-security";
import type { WorkflowDefinition } from "@/lib/workflow";

interface WorkflowSecurityPanelProps {
  locale: Locale;
  workflow: WorkflowDefinition;
  sessionId?: string;
  onSecurityUpdated: (workflow: WorkflowDefinition) => void;
}

function WorkflowSecurityPanelInner({
  locale,
  workflow,
  sessionId,
  onSecurityUpdated,
}: WorkflowSecurityPanelProps) {
  const copy = COPY[locale];
  const security = workflow.security;
  const [visibility, setVisibility] = useState<WorkflowVisibility>(
    security?.visibility ?? "private",
  );
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/workflow/security", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow: {
            ...workflow,
            security: {
              ...security,
              visibility,
            },
          },
          sessionId,
          visibility,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? "Failed to update security.");
      }

      const data = (await response.json()) as { workflow: WorkflowDefinition };
      onSecurityUpdated(data.workflow);
      toast.success(copy.workflowSecuritySaved);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : copy.workflowSecuritySaveFailed,
      );
    } finally {
      setSaving(false);
    }
  }, [
    copy.workflowSecuritySaveFailed,
    copy.workflowSecuritySaved,
    onSecurityUpdated,
    security,
    sessionId,
    visibility,
    workflow,
  ]);

  const role = security?.ownerId ? WORKFLOW_ROLE_LABELS.owner : "—";

  return (
    <div className="space-y-2 rounded-md border bg-muted/15 p-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Shield className="h-3 w-3" />
        {copy.workflowSecurityTitle}
      </div>

      <div className="space-y-1">
        <Label htmlFor="workflow-visibility" className="text-xs">
          {copy.workflowSecurityVisibility}
        </Label>
        <select
          id="workflow-visibility"
          value={visibility}
          onChange={(event) =>
            setVisibility(event.target.value as WorkflowVisibility)
          }
          className="h-8 w-full rounded-md border bg-background px-2 text-xs"
        >
          {(Object.keys(WORKFLOW_VISIBILITY_LABELS) as WorkflowVisibility[]).map(
            (key) => (
              <option key={key} value={key}>
                {WORKFLOW_VISIBILITY_LABELS[key]}
              </option>
            ),
          )}
        </select>
      </div>

      <p className="text-[10px] text-muted-foreground">
        {copy.workflowSecurityRole}: {role}
        {security?.permissions?.length
          ? ` · ${security.permissions.length} ${copy.workflowSecurityGrants}`
          : ""}
      </p>

      {security?.approvalHierarchy?.length ? (
        <p className="text-[10px] text-muted-foreground">
          {copy.workflowSecurityApprovalLevels}:{" "}
          {security.approvalHierarchy
            .map((level) => level.label)
            .join(" → ")}
        </p>
      ) : null}

      <Button
        type="button"
        size="xs"
        variant="outline"
        className="h-7 w-full text-[10px]"
        disabled={saving}
        onClick={() => void handleSave()}
      >
        {saving ? copy.workflowSecuritySaving : copy.workflowSecuritySave}
      </Button>
    </div>
  );
}

export const WorkflowSecurityPanel = memo(WorkflowSecurityPanelInner);