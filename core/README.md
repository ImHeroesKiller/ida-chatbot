# IDA Core Architecture

**Intelligent Decision Automation - Core System**

This directory contains the foundational architecture for IDA MVP, implementing the MASTER CONTEXT principles:

## Principles

- **DECISION-CENTRIC**: All structures revolve around discrete, traceable decisions
- **GOVERNANCE-MANDATORY**: Every decision includes approval, audit, and compliance metadata
- **HUMAN-AMPLIFICATION**: AI augments human judgment; humans retain final authority  
- **EXECUTION-FIRST**: Decisions are actionable and immediately executable

## Architecture

### `/decision-engine` - Core Decision Management

- **types.ts** - Decision, DecisionStatus, DecisionPriority, ActionPlan, approval workflows
- **service.ts** - DecisionEngineService for CRUD, approval, execution, revocation
- **repository.ts** - Data access layer (InMemory and Supabase implementations)

**Use case**: Create a recruitment decision → collect AI analysis → route for approvals → execute action plan

### `/digital-workforce` - Agent Orchestration

- **registry.ts** - Agent registry with capabilities, task tracking, and lifecycle management
- **recruitment-agents.ts** - Specialized agents:
  - **ResearcherAgent**: Gathers candidate/role data, analyzes fit (HUMAN-AMPLIFICATION)
  - **DocumentSpecialistAgent**: Generates offer letters, contracts (EXECUTION-FIRST)
  - **ApprovalCoordinatorAgent**: Routes approvals, ensures compliance (GOVERNANCE-MANDATORY)
- **supervisor.ts** - WorkforceSupervisor orchestrates agents for complete decision analysis

**Use case**: Given a candidate, researcher analyzes fit → document specialist prepares offer → approval coordinator routes to managers

### `/governance` - Compliance & Audit

- **audit.ts** - AuditLog maintains immutable record of all decision events
- **approval.ts** - ApprovalManager enforces approval policies and escalation rules

**Use case**: Track every decision state change, approval, override, and execution for compliance

## Integration with Chat/Tools

Core modules reuse existing IDA chat tools:

- **research** - ResearcherAgent calls research API
- **worksheet** - DocumentSpecialistAgent generates documents
- **workflow** - ApprovalCoordinatorAgent routes approvals

No modifications to existing chat/landing page code.

## Recruitment Workspace Integration

The recruitment workspace (`app/(app)/recruitment/`) integrates all core modules:

- **Dashboard** (`page.tsx`) - Decision listing, pipeline overview, quick create
- **Decision Detail** (`[decisionId]/page.tsx`) - Full decision lifecycle management
- **API Routes** (`app/api/decisions/`) - REST endpoints for CRUD, approvals, execution

## Quick Start

```typescript
// Create decision
const service = new DecisionEngineService(repository);
const decision = await service.createDecision(
  input,
  userId,
  aiAnalysis,
  actionPlan
);

// Submit for approval
await service.submitForApproval(decision.id);

// Record approval
await service.recordApproval(
  decision.id,
  approverId,
  approverName,
  approverRole,
  true // approved
);

// Execute
if (decision.metadata.status === DecisionStatus.APPROVED) {
  await service.markForExecution(decision.id);
}
```

## Next Steps

1. **Database Schema**: Create Supabase tables for decisions, approvals, audit logs
2. **API Routes**: Connect to real database instead of in-memory
3. **UI Components**: Complete decision dashboard, approval inbox, execution monitor
4. **Testing**: Unit tests for decision state transitions, approval workflows
5. **Audit Dashboard**: Admin view of all decisions and compliance logs

## File Structure

```
core/
├── decision-engine/
│   ├── types.ts
│   ├── service.ts
│   └── repository.ts
├── digital-workforce/
│   ├── registry.ts
│   ├── recruitment-agents.ts
│   └── supervisor.ts
├── governance/
│   ├── audit.ts
│   └── approval.ts
└── README.md

app/(app)/recruitment/
├── layout.tsx
├── page.tsx
└── [decisionId]/
    └── page.tsx

app/api/decisions/
├── route.ts
└── [id]/
    └── route.ts
```
