"use client";

import { Settings2, Trash2 } from "lucide-react";
import { memo } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import {
  WORKFLOW_NODE_ACTIONS,
  getWorkflowNodeActionDefinition,
  parseWorkflowNodeActionId,
  readWorkflowNodeActionParams,
  type WorkflowNodeActionId,
} from "@/lib/workflow-actions";
import { getWorkflowNodePrompt, type WorkflowNode } from "@/lib/workflow";

export interface WorkflowNodePropertiesPanelProps {
  locale: Locale;
  node: WorkflowNode;
  onUpdateNodeData: (patch: Partial<WorkflowNode["data"]>) => void;
  onOpenSchedule?: () => void;
  onDeleteNode: () => void;
}

function WorkflowNodePropertiesPanelInner({
  locale,
  node,
  onUpdateNodeData,
  onOpenSchedule,
  onDeleteNode,
}: WorkflowNodePropertiesPanelProps) {
  const copy = COPY[locale];
  const actionId = parseWorkflowNodeActionId(node.data.config?.action);
  const actionDef = getWorkflowNodeActionDefinition(actionId);
  const actionParams = readWorkflowNodeActionParams(node);
  const showNodeActionConfig =
    node.data.kind === "action" || node.data.kind === "output";

  const updateConfig = (configPatch: Record<string, unknown>) => {
    onUpdateNodeData({
      config: { ...node.data.config, ...configPatch },
    });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="workflow-node-kind" className="text-xs">
          {copy.workflowNodeKind}
        </Label>
        <Input
          id="workflow-node-kind"
          value={node.data.kind}
          readOnly
          className="h-8 text-xs capitalize"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="workflow-node-label" className="text-xs">
          {copy.workflowNodeLabel}
        </Label>
        <Input
          id="workflow-node-label"
          value={node.data.label}
          onChange={(event) =>
            onUpdateNodeData({ label: event.target.value })
          }
          className="h-8 text-xs"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="workflow-node-description" className="text-xs">
          {copy.workflowNodeDescription}
        </Label>
        <Textarea
          id="workflow-node-description"
          value={node.data.description ?? ""}
          onChange={(event) =>
            onUpdateNodeData({
              description: event.target.value || undefined,
            })
          }
          rows={3}
          className="min-h-[4rem] resize-none text-xs"
        />
      </div>

      {showNodeActionConfig ? (
        <>
          <div className="space-y-1">
            <Label htmlFor="workflow-node-action" className="text-xs">
              {copy.workflowNodeAction}
            </Label>
            <select
              id="workflow-node-action"
              value={actionId}
              onChange={(event) =>
                updateConfig({
                  action: event.target.value,
                  actionParams:
                    event.target.value === "llm"
                      ? undefined
                      : node.data.config?.actionParams,
                })
              }
              className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
            >
              {WORKFLOW_NODE_ACTIONS.map((action) => (
                <option key={action.id} value={action.id}>
                  {action.label}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-muted-foreground">
              {actionDef.description}
            </p>
          </div>

          {actionDef.paramFields.length > 0 ? (
            <div className="space-y-2 rounded-md border border-dashed p-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {copy.workflowActionParams}
              </p>
              {actionDef.paramFields.map((field) => (
                <div key={field.key} className="space-y-1">
                  <Label
                    htmlFor={`workflow-action-${field.key}`}
                    className="text-xs"
                  >
                    {field.label}
                  </Label>
                  {field.multiline ? (
                    <Textarea
                      id={`workflow-action-${field.key}`}
                      value={actionParams[field.key] ?? ""}
                      onChange={(event) =>
                        updateConfig({
                          actionParams: {
                            ...actionParams,
                            [field.key]: event.target.value,
                          },
                        })
                      }
                      rows={3}
                      placeholder={field.placeholder}
                      className="min-h-[4rem] resize-none text-xs"
                    />
                  ) : (
                    <Input
                      id={`workflow-action-${field.key}`}
                      value={actionParams[field.key] ?? ""}
                      onChange={(event) =>
                        updateConfig({
                          actionParams: {
                            ...actionParams,
                            [field.key]: event.target.value,
                          },
                        })
                      }
                      placeholder={field.placeholder}
                      className="h-8 text-xs"
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground">
              {copy.workflowActionLlmHint}
            </p>
          )}
        </>
      ) : null}

      {node.data.kind === "trigger" && onOpenSchedule ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-full text-xs"
          onClick={onOpenSchedule}
        >
          <Settings2 className="mr-1.5 h-3.5 w-3.5" />
          {copy.workflowScheduleTitle}
        </Button>
      ) : null}

      {node.data.kind !== "trigger" ? (
        <div className="space-y-1">
          <Label htmlFor="workflow-node-prompt" className="text-xs">
            {node.data.kind === "approval"
              ? copy.workflowApprovalPrompt
              : copy.workflowNodePrompt}
          </Label>
          <Textarea
            id="workflow-node-prompt"
            value={getWorkflowNodePrompt(node)}
            onChange={(event) =>
              onUpdateNodeData({
                prompt: event.target.value || undefined,
                config: {
                  ...node.data.config,
                  prompt: event.target.value || undefined,
                },
              })
            }
            rows={4}
            placeholder={
              node.data.kind === "approval"
                ? copy.workflowApprovalDescription
                : "Instruksi LLM untuk node ini..."
            }
            className="min-h-[5rem] resize-none text-xs"
          />
        </div>
      ) : null}

      {node.data.kind === "action" ||
      node.data.kind === "output" ||
      node.data.kind === "condition" ? (
        <div className="space-y-1">
          <Label htmlFor="workflow-max-retries" className="text-xs">
            {copy.workflowMaxRetries}
          </Label>
          <Input
            id="workflow-max-retries"
            type="number"
            min={0}
            max={5}
            value={
              typeof node.data.config?.maxRetries === "number"
                ? node.data.config.maxRetries
                : 2
            }
            onChange={(event) =>
              updateConfig({
                maxRetries: Math.min(
                  5,
                  Math.max(0, Number(event.target.value) || 0),
                ),
              })
            }
            className="h-8 text-xs"
          />
        </div>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="xs"
        className="w-full text-destructive hover:text-destructive"
        onClick={onDeleteNode}
      >
        <Trash2 className="mr-1 h-3 w-3" />
        {copy.workflowDeleteNode}
      </Button>
    </div>
  );
}

export const WorkflowNodePropertiesPanel = memo(WorkflowNodePropertiesPanelInner);