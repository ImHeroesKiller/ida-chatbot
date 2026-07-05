-- IDA Decision Engine Schema
-- Supabase migration for core recruitment decision management
-- Tables: decisions, decision_approvals, decision_audit_logs

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Decisions table
-- Core entity for hiring decisions with full governance metadata
create table if not exists decisions (
  id text primary key,
  title text not null,
  description text not null,
  context_type text not null check (context_type in ('hr-recruitment', 'financial', 'operational', 'strategic', 'compliance', 'custom')),
  status text not null default 'draft' check (status in ('draft', 'pending_approval', 'approved', 'in_execution', 'completed', 'rejected', 'failed', 'revoked')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  
  -- AI Analysis (JSONB)
  ai_analysis jsonb not null,
  
  -- Decision content
  context_data jsonb not null,
  
  -- Action plan (JSONB)
  action_plan jsonb not null,
  
  -- Human decision maker notes
  human_notes text,
  override_ai_recommendation boolean default false,
  override_reason text,
  
  -- Governance metadata
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  execution_started_at timestamptz,
  execution_completed_at timestamptz,
  execution_error text,
  rejection_reason text,
  revocation_reason text,
  tags text[] default array[]::text[],
  external_id text,
  
  -- For search and indexing
  search_text text generated always as (
    title || ' ' || description || ' ' || coalesce(context_data->>'candidateName', '') || ' ' || coalesce(context_data->>'position', '')
  ) stored
);

-- Create indexes for common queries
create index if not exists decisions_status_idx on decisions (status);
create index if not exists decisions_context_type_idx on decisions (context_type);
create index if not exists decisions_priority_idx on decisions (priority);
create index if not exists decisions_created_by_idx on decisions (created_by);
create index if not exists decisions_created_at_idx on decisions (created_at desc);
create index if not exists decisions_tags_idx on decisions using gin (tags);
create index if not exists decisions_search_idx on decisions using gin (to_tsvector('english', search_text));

-- Decision approvals table
-- Tracks all approval decisions for governance
create table if not exists decision_approvals (
  id uuid primary key default gen_random_uuid(),
  decision_id text not null references decisions(id) on delete cascade,
  actor_id text not null,
  actor_name text not null,
  actor_role text not null,
  approved boolean not null,
  timestamp timestamptz not null default now(),
  comment text,
  overridden_prior_decision boolean default false,
  
  created_at timestamptz not null default now()
);

create index if not exists decision_approvals_decision_id_idx on decision_approvals (decision_id);
create index if not exists decision_approvals_actor_id_idx on decision_approvals (actor_id);
create index if not exists decision_approvals_timestamp_idx on decision_approvals (timestamp desc);

-- Decision audit log table
-- Immutable audit trail of all decision events
create table if not exists decision_audit_logs (
  id text primary key,
  decision_id text not null references decisions(id) on delete cascade,
  event_type text not null check (
    event_type in (
      'decision_created',
      'decision_submitted',
      'decision_updated',
      'approval_recorded',
      'decision_rejected',
      'decision_approved',
      'execution_started',
      'execution_completed',
      'execution_failed',
      'decision_revoked',
      'human_override'
    )
  ),
  user_id text not null,
  user_name text,
  user_role text,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  status text not null default 'success' check (status in ('success', 'failure')),
  error_message text,
  
  timestamp timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists decision_audit_logs_decision_id_idx on decision_audit_logs (decision_id);
create index if not exists decision_audit_logs_event_type_idx on decision_audit_logs (event_type);
create index if not exists decision_audit_logs_user_id_idx on decision_audit_logs (user_id);
create index if not exists decision_audit_logs_timestamp_idx on decision_audit_logs (timestamp desc);

-- Function: Get approval status for a decision
create or replace function get_decision_approval_status(decision_id_param text)
returns table (
  total_approvals bigint,
  approved_count bigint,
  rejected_count bigint,
  pending_count bigint,
  approval_status text
) as $$
begin
  return query
  with approval_counts as (
    select
      count(*) as total,
      sum(case when approved = true then 1 else 0 end) as approved,
      sum(case when approved = false then 1 else 0 end) as rejected
    from decision_approvals
    where decision_id = decision_id_param
  )
  select
    ac.total,
    ac.approved,
    ac.rejected,
    case
      when ac.total is null then 0::bigint
      else ac.total - coalesce(ac.approved, 0) - coalesce(ac.rejected, 0)
    end as pending,
    case
      when ac.rejected > 0 then 'rejected'::text
      when ac.approved = ac.total and ac.total > 0 then 'approved'::text
      else 'pending'::text
    end as status
  from approval_counts ac;
end;
$$ language plpgsql;

-- RLS Policies (if using auth)
-- Uncomment and configure as needed for your auth setup
-- alter table decisions enable row level security;
-- alter table decision_approvals enable row level security;
-- alter table decision_audit_logs enable row level security;

-- Example policy (adjust user_id to match your auth system):
-- create policy "Users can read own decisions" on decisions for select
--   using (auth.uid()::text = created_by);

comment on table decisions is 'Core decisions table for IDA Decision Engine';
comment on table decision_approvals is 'Approval workflow tracking';
comment on table decision_audit_logs is 'Immutable audit trail of decision events';
