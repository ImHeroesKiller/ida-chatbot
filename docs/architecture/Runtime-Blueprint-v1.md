# Runtime Blueprint v1.0

**Project:** IDA Enterprise Cognitive Operating System  
**Phase:** E — Runtime Blueprint  
**Date:** 2026-07-08  
**Status:** Architecture Level Only (No Implementation)  
**Baseline:** ADR-0000 to ADR-0006 (Frozen) + Architecture Conformance Audit v1.0

---

## Purpose of This Document

This blueprint defines the **10 Runtime layers** at a pure architectural level. It serves as the bridge between the frozen ADR v1.0 and implementation work in Sprint 4 and beyond.

**Strict Boundaries:**
- This document does **not** design APIs, databases, class structures, or event bus implementations.
- It only defines **responsibilities, boundaries, contracts, and migration direction**.
- All decisions here remain consistent with ADR-0003 (Runtime Architecture).

---

## 1. Runtime Responsibilities

| Runtime | Owns | Reads | Publishes | Depends On |
|---------|------|-------|-----------|------------|
| **Enterprise Runtime** | Organization, Identity, Permission, Active Perspective, Enterprise Policy | Authentication events | Enterprise Context, Perspective Changed | Identity |
| **Mission Runtime** | Active Mission, Mission Context, Reality Activation | Enterprise Context | Mission Activated, Reality Activated | Enterprise Runtime |
| **Understanding Runtime** | Understanding of Reality, Implications, Priority signals | Reality, Mission Context | Understanding Completed | Mission Runtime, Observation Runtime |
| **Reasoning Runtime** | Option evaluation, Trade-off analysis, Probability assessment | Understanding output, Knowledge | Reasoning Completed | Understanding Runtime, Knowledge Runtime |
| **Decision Runtime** | Decision lifecycle, Decision state, Decision approval trigger | Reasoning output, Policy | Decision Approved, Decision Cancelled | Reasoning Runtime, Enterprise Runtime (Policy) |
| **Workflow Runtime** | Workflow orchestration, Task execution, Workflow state | Decision trigger, Templates | Workflow Started, Workflow Completed, Workflow Failed | Decision Runtime, Digital Workforce Runtime |
| **Digital Workforce Runtime** | AI Agents lifecycle, Agent registry, Agent execution | Workflow tasks, Tools | Agent Started, Agent Completed, Agent Error | Workflow Runtime, Knowledge Runtime |
| **Observation Runtime** | Event capture, Signal detection, Change detection | Reality sources (Gmail, etc.) | Observation Captured | Enterprise Runtime |
| **Knowledge Runtime** | Knowledge Graph, Semantic Layer, Retrieval | Observations, Representations | Knowledge Updated | Observation Runtime, Identity Runtime |
| **Memory Runtime** | Enterprise Memory, Conversation Memory, Learning signals | All Runtime events | Memory Stored, Memory Retrieved | All Runtimes (read-only for most) |

---

## 2. Runtime Boundaries

### Enterprise Runtime
**Responsible for:**
- Organization identity and structure
- User identity and permission resolution
- Active Perspective management
- Enterprise-level policy enforcement

**Not Responsible for:**
- Business logic of specific missions or decisions
- UI rendering
- Workflow execution
- AI agent behavior

### Mission Runtime
**Responsible for:**
- Activating and deactivating missions
- Maintaining mission-specific context
- Triggering Reality activation for a mission

**Not Responsible for:**
- Understanding or reasoning about reality
- Making decisions
- Executing workflows

### Understanding Runtime
**Responsible for:**
- Interpreting Reality in the context of active Mission
- Generating implications and priority signals
- Producing structured Understanding output

**Not Responsible for:**
- Evaluating options or making trade-offs (Reasoning)
- Storing long-term knowledge
- Executing actions

### Reasoning Runtime
**Responsible for:**
- Evaluating possible actions based on Understanding
- Analyzing trade-offs and probabilities
- Producing reasoned recommendations

**Not Responsible for:**
- Final decision selection (Decision Runtime)
- Executing actions
- Maintaining memory

### Decision Runtime
**Responsible for:**
- Managing the full lifecycle of a Decision
- Enforcing approval policies
- Triggering execution once a decision is approved

**Not Responsible for:**
- How the decision was reasoned (Reasoning Runtime)
- How it will be executed (Workflow Runtime)
- UI for decision making

### Workflow Runtime
**Responsible for:**
- Orchestrating multi-step workflows
- Managing workflow state and transitions
- Coordinating Digital Workforce execution

**Not Responsible for:**
- Decision making
- AI agent internal logic
- User interface

### Digital Workforce Runtime
**Responsible for:**
- Agent registration and capability advertisement
- Agent lifecycle (start, pause, stop, error handling)
- Agent execution sandbox coordination

**Not Responsible for:**
- Workflow orchestration logic
- Knowledge retrieval
- Decision approval

### Observation Runtime
**Responsible for:**
- Capturing external and internal signals
- Detecting meaningful changes in Reality
- Publishing normalized Observation events

**Not Responsible for:**
- Interpreting the meaning of observations (Understanding)
- Long-term storage of knowledge
- Acting on observations

### Knowledge Runtime
**Responsible for:**
- Maintaining the canonical Knowledge Graph
- Semantic representation and retrieval
- Identity resolution across entities

**Not Responsible for:**
- Capturing raw observations
- Making decisions
- Executing workflows

### Memory Runtime
**Responsible for:**
- Storing and retrieving Enterprise Memory
- Providing historical context to other Runtimes
- Supporting learning signals

**Not Responsible for:**
- Real-time decision making
- Workflow execution
- UI state management

---

## 3. Event Contract (Conceptual)

These are the primary conceptual events that Runtimes publish. This is **not** a technical event schema.

| Event | Published By | Consumed By (Expected) | Purpose |
|-------|--------------|------------------------|---------|
| `EnterpriseContextUpdated` | Enterprise Runtime | Most Runtimes | Notify change in organization, identity, or active perspective |
| `MissionActivated` | Mission Runtime | Understanding, Reasoning, Decision | A new mission context is now active |
| `RealityUpdated` | Mission Runtime / Observation Runtime | Understanding Runtime | Reality has changed and needs interpretation |
| `UnderstandingCompleted` | Understanding Runtime | Reasoning Runtime | Structured understanding of current reality is available |
| `ReasoningCompleted` | Reasoning Runtime | Decision Runtime | Options and trade-offs have been analyzed |
| `DecisionApproved` | Decision Runtime | Workflow Runtime | A decision has been approved and should be executed |
| `DecisionCancelled` | Decision Runtime | All interested Runtimes | A decision was cancelled |
| `WorkflowStarted` | Workflow Runtime | Digital Workforce, Memory | A workflow instance has begun |
| `WorkflowCompleted` | Workflow Runtime | Memory, Mission Runtime | A workflow has finished successfully |
| `WorkflowFailed` | Workflow Runtime | Memory, Governance | A workflow encountered an error |
| `ObservationCaptured` | Observation Runtime | Knowledge Runtime, Understanding Runtime | A new signal from reality has been captured |
| `KnowledgeUpdated` | Knowledge Runtime | Reasoning, Understanding, Memory | The knowledge graph has been updated |
| `MemoryStored` | Memory Runtime | All Runtimes (read) | New memory entry is available |

---

## 4. Runtime Lifecycle

| Runtime | Creation | Active Scope | Deactivation | Lifecycle Type |
|---------|----------|--------------|--------------|----------------|
| **Enterprise Runtime** | When user session starts with valid organization | Per authenticated organization session | When session ends or organization context changes | Singleton per organization session |
| **Mission Runtime** | When a mission is activated | Per active mission | When mission is completed or deactivated | Scoped per mission |
| **Understanding Runtime** | On demand when Reality needs interpretation | Per Reality update cycle | After Understanding is published | Ephemeral / Request scoped |
| **Reasoning Runtime** | On demand after Understanding is available | Per reasoning cycle | After Reasoning output is published | Ephemeral / Request scoped |
| **Decision Runtime** | When a decision process is initiated | Per decision instance | When decision reaches terminal state (Approved / Cancelled) | Scoped per decision |
| **Workflow Runtime** | When a workflow is triggered by a decision | Per workflow instance | When workflow reaches terminal state | Scoped per workflow instance |
| **Digital Workforce Runtime** | When agent execution is requested | Per agent task execution | After agent task completes or fails | Ephemeral per task |
| **Observation Runtime** | At system startup or when observation sources are registered | Continuous while system is running | Only on system shutdown | Long-running / Singleton |
| **Knowledge Runtime** | At system startup | Continuous | Only on system shutdown | Long-running / Singleton |
| **Memory Runtime** | At system startup | Continuous | Only on system shutdown | Long-running / Singleton |

---

## 5. Runtime Dependency Diagram (Conceptual)

```
Enterprise Runtime
       ↓
Mission Runtime
       ↓
Understanding Runtime ← Observation Runtime
       ↓
Reasoning Runtime ← Knowledge Runtime
       ↓
Decision Runtime
       ↓
Workflow Runtime
       ↓
Digital Workforce Runtime

Memory Runtime (read by almost all)
```

**Notes on Dependencies:**
- Flow is generally **one-directional** from Enterprise → Mission → Understanding → Reasoning → Decision → Workflow → Workforce.
- Knowledge and Observation feed into Understanding/Reasoning.
- Memory is mostly read-only for other Runtimes.
- **No circular dependencies** are intended in this model.
- Potential risk area: Strong coupling between Workflow and Digital Workforce may need careful interface design later.

---

## 6. Mapping Existing Code to Target Runtime

| Existing Code Area | Current State | Target Runtime | Recommended Action | Priority |
|--------------------|---------------|----------------|--------------------|----------|
| `core/decision-engine/` | Partial implementation | Decision Runtime | Move and expand into full Decision Runtime package | High |
| `packages/esl/*` (observation, representation, graph, query) | Good foundation | Knowledge Runtime | Keep and evolve as core of Knowledge Runtime | Medium |
| `packages/observation/` | Basic extractors | Observation Runtime | Expand and formalize as Observation Runtime | Medium |
| `core/digital-workforce/` | Registry + Supervisor | Digital Workforce Runtime | Formalize as Digital Workforce Runtime | High |
| `lib/workflow-executor.ts` + related | Heavy orchestration logic | Workflow Runtime | Extract into Workflow Runtime package | Critical |
| `lib/chat-store.ts` + `use-chat-*` hooks | Mixed state + business logic | Mission + Understanding Runtime | Split and move logic out of hooks/store | Critical |
| `lib/agent/` (multi-agent, handler) | Deeply entangled with chat | Digital Workforce Runtime | Decouple from chat layer | Critical |
| `lib/workflow-security/` | Well isolated | Enterprise Runtime (Governance) | Keep and align under Enterprise Runtime | Low |
| `components/enterprise/experience/*` | Mostly View | View layer | Keep as View, remove any business logic | Low |
| `app/api/decisions/` & `app/api/workflow/` | API entry points | Decision / Workflow Runtime | Become thin adapters to Runtime | High |

---

## 7. Recommended Migration Order

Based on the Architecture Conformance Audit and risk minimization:

| Order | Runtime | Rationale |
|-------|---------|-----------|
| 1 | **Enterprise Runtime** | Foundational. Many other Runtimes depend on Perspective, Identity, and Policy. |
| 2 | **Mission Runtime** | Needed early to give context to Understanding and Decision work. |
| 3 | **Enterprise Operating Shell** | Although not a Runtime, it is critical infrastructure. Should be stabilized early so Views can be cleaned safely. |
| 4 | **Decision Runtime** | High existing debt in `core/decision-engine`. Important for recruitment and governance features. |
| 5 | **Workflow Runtime** | Currently one of the most entangled areas. Extracting it reduces risk for future features. |
| 6 | **Knowledge Runtime** | Leverage existing `packages/esl/` work. Lower risk because it is already relatively well structured. |
| 7 | **Memory Runtime** | Can be introduced incrementally once other Runtimes start publishing events. |
| 8 | **Understanding Runtime** + **Reasoning Runtime** | These are newer concepts. Introduce after Decision and Workflow are more stable. |
| 9 | **Digital Workforce Runtime** | Depends on Workflow. Better to stabilize Workflow first. |
| 10 | **Observation Runtime** | Can be expanded from existing packages, but lower urgency than core decision/workflow paths. |

**Alternative consideration:** If recruitment features are prioritized, Decision Runtime could be moved to position 3.

---

## Final Notes

This Runtime Blueprint is intentionally kept at the **architectural contract level**. It provides clear ownership, boundaries, and migration direction without prescribing implementation details.

With this document + the previous ADR set and Conformance Audit, the team now has:

- A frozen constitution (ADR v1.0)
- An honest current-state assessment
- A clear target architecture for the 10 Runtimes
- A prioritized, low-risk migration path

This should allow Sprint 4 to begin implementation work with significantly reduced risk of architectural drift.

---

**End of Runtime Blueprint v1.0**