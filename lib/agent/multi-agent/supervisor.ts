import type { MultiAgentGraphState } from "./state";
import { appendAgentActivity } from "./agents";
import { getMultiAgentLabel } from "./types";

/** Supervisor routes each workflow step to exactly one specialist agent. */
export function supervisorNode(
  state: MultiAgentGraphState,
): Partial<MultiAgentGraphState> {
  if (state.stepComplete) {
    return {};
  }

  if (state.agentDispatched) {
    return {};
  }

  const label = getMultiAgentLabel(state.assignedAgent, state.locale);
  const routing = appendAgentActivity(state, {
    agentId: "supervisor",
    status: "running",
    message: `Routing task to ${label}…`,
  });

  const routed = appendAgentActivity(
    { ...state, activities: [...state.activities, ...routing] },
    {
      agentId: "supervisor",
      status: "completed",
      message: `Assigned to ${label}`,
      completedAt: Date.now(),
    },
  );

  return {
    agentDispatched: true,
    activities: [...routing, ...routed],
  };
}