# Supabase Decision Engine Implementation

## Overview

The decision engine now persists all data to Supabase PostgreSQL with full transaction safety, audit logging, and JSONB support.

## Database Schema

### Tables

#### `decisions`
- Core decisions table with JSONB columns for AI analysis, context data, and action plans
- Indexed on: status, context_type, priority, created_by, created_at, tags
- Full-text search on title + description + candidate name + position
- Soft delete via revocation status

#### `decision_approvals`
- Tracks all approval decisions with actor information
- Links to decisions via foreign key
- Indexed on: decision_id, actor_id, timestamp

#### `decision_audit_logs`
- Immutable audit trail of all decision events
- Includes event type, actor, action, and error tracking
- Indexed on: decision_id, event_type, user_id, timestamp

### Functions

#### `get_decision_approval_status(decision_id_param text)`
- Calculates approval status (pending, approved, rejected)
- Returns counts of total, approved, rejected, and pending approvals

## Implementation Details

### SupabaseDecisionRepository

Complete CRUD operations with error handling:

```typescript
// Save (upsert)
await repository.save(decision);

// Find by ID
const decision = await repository.findById(id);

// Query with filtering
const { decisions, total } = await repository.query({
  status: DecisionStatus.PENDING_APPROVAL,
  contextType: 'hr-recruitment',
  limit: 20,
  offset: 0,
});

// Delete (soft delete)
await repository.delete(id);
```

### Audit Logging

Automatic audit trail on all operations:

```typescript
await repository.addAuditLog(
  decisionId,
  AuditEventType.APPROVAL_RECORDED,
  userId,
  'Approved by HR Manager',
  { actorName, actorRole, approved },
  { userAgent, ipAddress }
);
```

### Error Handling

- All Supabase errors wrapped with descriptive messages
- Audit log failures don't block main operations (best-effort)
- Validation on required fields before save
- Transaction safety via UPSERT

## API Routes

### `GET /api/decisions`

List decisions with filtering:

```bash
GET /api/decisions?status=pending_approval&limit=20&offset=0
```

### `POST /api/decisions`

Create new decision:

```bash
POST /api/decisions
Body: {
  title: string
  description: string
  contextType: DecisionContextType
  contextData: object
  aiAnalysis: AIAnalysisResult
  actionPlan: ActionPlan
  requiredApprovers: ApprovalActor[]
  tags?: string[]
  externalId?: string
}
```

### `GET /api/decisions/:id`

Fetch single decision:

```bash
GET /api/decisions/dec_001
```

### `POST /api/decisions/:id?action=approve`

Record approval:

```bash
POST /api/decisions/dec_001?action=approve
Body: {
  actorId: string
  actorName: string
  actorRole: string
  approved: boolean
  comment?: string
}
```

### `POST /api/decisions/:id?action=execute`

Start execution:

```bash
POST /api/decisions/dec_001?action=execute
```

## Environment Setup

Add to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Optional, for server-only ops
```

## Migration

Run the migration in Supabase SQL Editor:

```bash
# In Supabase → SQL Editor, paste and run:
supabase/migrations/20260705_decision_engine_schema.sql
```

Or use Supabase CLI:

```bash
supabase db push
```

## Performance

- Indexes on common filters (status, priority, created_by, created_at)
- Full-text search index for title/description
- GIN index on tags array
- JSONB columns optimized for nested queries
- Pagination via LIMIT/OFFSET

## Transaction Safety

- UPSERT for idempotent saves
- Foreign key constraints on approvals and audit logs
- Cascading deletes (soft via revocation)
- No concurrent modification risks

## Next Steps

1. **Test migrations** - Run SQL in Supabase console
2. **Update environment** - Add Supabase keys to `.env.local`
3. **Test API endpoints** - Use Postman or curl
4. **Add auth** - Enable RLS policies
5. **Monitor** - Check Supabase dashboard for query performance
