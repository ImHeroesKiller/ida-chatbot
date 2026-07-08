# Architecture Conformance Audit v1.0

**Project:** IDA Enterprise Cognitive Operating System  
**Audit Date:** 2026-07-08  
**Auditor:** Grok (based on ADR-0000 to ADR-0006)  
**Baseline:** IDA Architecture v1.0 (Frozen)  
**Status:** Objective Baseline Report

---

## 1. Executive Summary

This audit evaluates the current implementation of `ida-chatbot` against the frozen **IDA Architecture v1.0** defined in ADR-0000 through ADR-0006.

**Key Findings:**

- The project has made significant early progress in several areas (especially workflow, ESL packages, and decision-related code).
- However, there is **no clear separation** between Runtime, Shell, and View layers as required by ADR-0003 and ADR-0004.
- Business logic is heavily concentrated in React components, hooks, and `lib/` services.
- The `core/` and `packages/` directories show promising direction but are incomplete and not yet aligned with the 10 Runtime model.
- **Cognitive Flow** (Reality → Understanding → Reasoning → Decision → Execution → Learning) is not yet reflected in the architecture.

**Overall ADR Compliance Score: 4.2 / 10**

The current implementation is closer to a **feature-rich AI application** than an **Enterprise Cognitive Operating System**. Significant structural work is required before new features can be safely added.

---

## 2. Runtime Mapping

| Existing Component | Current Role | Target ADR Runtime | Status | Confidence | Migration Note |
|--------------------|--------------|--------------------|--------|------------|----------------|
| `core/decision-engine/` | Decision management + persistence | Decision Runtime | 🟡 Partial | High | Needs extraction from service layer |
| `core/digital-workforce/` | Agent registry & supervisor | Digital Workforce Runtime | 🟡 Partial | High | Good start, needs clearer boundaries |
| `core/governance/` | Approval & audit | Governance (part of Enterprise Runtime) | 🔴 Weak | Medium | Very thin, mostly audit logging |
| `packages/esl/` | Observation → Representation → Graph | Knowledge Runtime | ✅ Good | High | Closest to target architecture |
| `packages/observation/` | Extractors & engine | Observation Runtime | 🟡 Partial | High | Rule-based extractors exist |
| `packages/identity/` | Identity resolution | Enterprise Runtime | 🔴 Missing | High | Only basic resolver |
| `packages/query/` | Query engine | Knowledge Runtime | 🟡 Partial | Medium | Limited to ESL currently |
| `lib/workflow/` + `lib/workflow-executor.ts` | Workflow orchestration | Workflow Runtime | 🟡 Partial | High | Heavy but mixed with chat logic |
| `lib/agent/` + multi-agent | AI Agent orchestration | Digital Workforce Runtime | 🔴 Mixed | High | Deeply entangled with chat |
| `lib/chat-store.ts` + `use-chat-*` hooks | Chat state + orchestration | Mission + Understanding Runtime | 🔴 Violates | High | Major violation — business logic in hooks |
| `app/api/decisions/` | Decision CRUD | Decision Runtime | 🟡 Partial | High | API layer, not Runtime |
| `app/api/workflow/` | Workflow execution | Workflow Runtime | 🟡 Partial | High | Needs to move into Runtime package |

---

## 3. Shell Mapping

| Existing Component | Current Role | Target (ADR-0004) | Status | Confidence | Migration Note |
|--------------------|--------------|-------------------|--------|------------|----------------|
| `components/enterprise/experience/enterprise-shell.tsx` | Basic shell | Enterprise Operating Shell | 🟡 Partial | Medium | Good start but incomplete |
| `components/enterprise/experience/enterprise-sidebar.tsx` | Sidebar | Shell - Navigation | 🟡 Partial | High | Should be part of Shell |
| `components/enterprise/experience/enterprise-topbar.tsx` | Top navigation | Shell - Header | 🟡 Partial | High | Should be part of Shell |
| `components/chat/sidebar.tsx` | Chat sidebar | Shell - Context Region | 🔴 Violates | High | Chat-specific, not unified Shell |
| `components/chat/header.tsx` | Chat header | Shell | 🔴 Violates | High | Duplicated logic |
| `components/enterprise/experience/global-search.tsx` | Global search | Shell - Command Layer | ✅ Good | High | Promising direction |
| `app/(app)/layout.tsx` | Root layout | Shell wrapper | 🟡 Partial | High | Needs to become thin Shell |
| `components/enterprise/experience/enterprise-dashboard.tsx` | Demo dashboard | View (not Shell) | ✅ Correct | High | Correctly treated as View |

**Finding:** There is no single authoritative **Enterprise Operating Shell**. Multiple competing layouts and headers exist across chat and enterprise sections.

---

## 4. View Mapping

| Existing Component | Current Role | Target (ADR) | Status | Confidence | Note |
|--------------------|--------------|--------------|--------|------------|------|
| `app/(app)/enterprise/page.tsx` + experience views | Enterprise dashboard | Perspective View / Capability View | ✅ Good | High | Mostly correct |
| `app/(app)/recruitment/[decisionId]/page.tsx` | Recruitment decision UI | Object View | 🟡 Partial | Medium | Mixed with logic |
| `components/enterprise/experience/views/*` | Various enterprise views | Perspective / Capability Views | ✅ Good | High | Clean separation |
| `components/chat/chat-room.tsx` + composer | Main chat interface | Object View (Chat) | 🔴 Mixed | High | Contains heavy business logic |
| `app/demo/page.tsx` | Investor demo | View | ✅ Correct | High | Correctly isolated |
| `components/admin/*` | Admin panels | Capability View (Admin) | 🟡 Partial | Medium | Needs Shell integration |

**Finding:** Pure View components are relatively clean in the enterprise section. The chat area is the biggest source of View + Logic entanglement.

---

## 5. Business Logic Audit

This is the most critical area.

| Location | Type of Logic | Should Belong To | Status | Confidence | Severity |
|----------|---------------|------------------|--------|------------|----------|
| `components/chat/hooks/use-chat-send.ts`, `use-chat-stream.ts` | Message sending + tool calling | Understanding + Decision Runtime | 🔴 Violates | High | Critical |
| `lib/workflow-chat.ts` + `lib/workflow-executor.ts` | Workflow execution + state | Workflow Runtime | 🔴 Violates | High | Critical |
| `lib/agent/handler.ts` + multi-agent | Agent orchestration | Digital Workforce Runtime | 🔴 Violates | High | High |
| `core/decision-engine/service.ts` | Decision creation & persistence | Decision Runtime | 🟡 Partial | High | Medium |
| `packages/esl/pipeline.ts` + store | ESL transformation pipeline | Knowledge Runtime | ✅ Good | High | Low |
| `lib/chat-store.ts` | Chat session + message state | Mission Runtime | 🔴 Violates | High | Critical |
| `app/api/agent/route.ts` | Agent API entrypoint | Digital Workforce Runtime | 🟡 Partial | Medium | Medium |
| `lib/workflow-security/` | Permission & approval logic | Enterprise Runtime (Governance) | ✅ Good | High | Low |
| `components/chat/tools/workflow-panel.tsx` | Workflow UI + logic | Workflow Runtime + View | 🔴 Violates | High | High |

**Conclusion on Business Logic:**
The majority of critical business logic currently lives in:
- React hooks (`use-chat-*`)
- `lib/` orchestration files
- Chat-related services

This is the **biggest architectural debt** of the project.

---

## 6. Gap Analysis

| Existing | Target ADR | Status | Priority | Migration Note |
|----------|------------|--------|----------|----------------|
| Chat orchestration | Mission + Understanding Runtime | 🔴 Major Gap | Critical | Must be extracted |
| Decision Engine | Decision Runtime | 🟡 Partial | High | Needs full Runtime package |
| ESL + Packages | Knowledge Runtime | ✅ Good foundation | Medium | Can be evolved |
| Workflow system | Workflow Runtime | 🟡 Partial | High | Needs clean separation from chat |
| Agent system | Digital Workforce Runtime | 🔴 Major Gap | Critical | Currently mixed with chat |
| Layouts & Headers | Enterprise Operating Shell | 🔴 Major Gap | High | Multiple competing shells |
| Views (Enterprise) | Perspective / Capability / Object View | ✅ Mostly correct | Low | Good pattern to follow |

---

## 7. Architecture Violations

| Violation | Related ADR | Impact | Priority | Description |
|-----------|-------------|--------|----------|-------------|
| Business logic in React hooks & components | ADR-0003, ADR-0004 | High | Critical | `use-chat-send`, `use-chat-stream`, workflow panels contain core logic |
| No unified Enterprise Operating Shell | ADR-0004 | High | High | Multiple layouts and headers exist |
| Chat Store manages too much | ADR-0003 | High | Critical | `chat-store.ts` acts as god object |
| Cognitive Flow not implemented | ADR-0005 | Medium | High | No clear Understanding → Reasoning → Decision pipeline |
| AI Agents tightly coupled to chat | ADR-0003 | High | Critical | `lib/agent/` cannot be used independently |
| Decision logic split between `core/` and `app/api/` | ADR-0003 | Medium | High | Inconsistent ownership |

---

## 8. Architecture Strengths

| Strength | Related ADR | Notes |
|----------|-------------|-------|
| ESL Package Structure | ADR-0003 (Knowledge Runtime) | `packages/esl/`, `observation/`, `graph/`, `query/` show correct direction |
| Workflow Security & Audit | ADR-0003 | `lib/workflow-security/` is well isolated |
| Digital Workforce Registry | ADR-0003 | `core/digital-workforce/registry.ts` is a good start |
| Enterprise View Separation | ADR-0004, ADR-0006 | Many `components/enterprise/experience/views/*` are clean |
| Decision Types & Repository | ADR-0002, ADR-0003 | `core/decision-engine/types.ts` and repository show domain thinking |
| Perspective Concept | ADR-0002 | Already appears in enterprise experience layer |

---

## 9. Scoring

| Domain | Score | Reasoning |
|--------|-------|-----------|
| **Runtime Readiness** | 3.5 / 10 | Some good isolated pieces (`core/`, `packages/`), but most critical logic still lives outside any Runtime |
| **Shell Readiness** | 2.5 / 10 | No single authoritative Shell. Multiple competing layouts and navigation systems |
| **View Separation** | 6.5 / 10 | Enterprise views are relatively clean. Chat area is heavily polluted |
| **Cognitive Alignment** | 2.0 / 10 | Almost no implementation of Reality → Understanding → Reasoning → Decision flow |
| **Overall ADR Compliance** | **4.2 / 10** | Early promising work exists, but structural violations are significant |

---

## 10. Prioritized Backlog

### Sprint 4 (Critical) — Must be done before new features

1. Extract core chat orchestration from hooks into **Mission + Understanding Runtime**
2. Create proper **Enterprise Operating Shell** (single source of layout, navigation, command)
3. Move `lib/workflow-executor` and related logic into **Workflow Runtime** package
4. Decouple AI Agent system from chat (`lib/agent/`)
5. Establish clear **Decision Runtime** boundary

### Sprint 5 (Important) — Improve architecture quality

1. Complete **Knowledge Runtime** based on existing `packages/esl/`
2. Implement basic **Observation Runtime** and **Memory Runtime**
3. Refactor `chat-store.ts` into proper Mission Runtime state
4. Create unified types for Core Operating Entities (Organization, Perspective, Mission, Reality, Decision)
5. Add Runtime interface contracts

### Future

- Full Cognitive Flow implementation (Understanding + Reasoning Runtime)
- Digital Workforce Runtime with proper agent lifecycle
- Governance Runtime (Policy engine)
- Learning Runtime

---

## 11. Recommendation

**Do not add new major features** until the critical items in Sprint 4 are addressed.

The current codebase has valuable components, but they are architecturally misplaced. Continuing to build on top of the current structure will increase technical debt and make future alignment with ADR v1.0 significantly harder.

**Recommended next step:** Proceed to **Phase E — Runtime Blueprint** only after the most critical violations (especially chat orchestration and Shell) are acknowledged and planned.

---

**End of Architecture Conformance Audit v1.0**

This document serves as the honest baseline for all future architectural work on IDA.