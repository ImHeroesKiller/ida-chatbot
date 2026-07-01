-- Workflow security ACL registry and audit trail (Phase 3.3)

create table if not exists ida_workflow_acl (
  id uuid primary key default gen_random_uuid(),
  workflow_id text not null,
  owner_user_id text not null,
  visibility text not null default 'private'
    check (visibility in ('private', 'shared', 'company')),
  session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ida_workflow_acl_workflow_id_idx
  on ida_workflow_acl (workflow_id);

create index if not exists ida_workflow_acl_owner_idx
  on ida_workflow_acl (owner_user_id);

create index if not exists ida_workflow_acl_visibility_idx
  on ida_workflow_acl (visibility);

create table if not exists ida_workflow_permissions (
  id uuid primary key default gen_random_uuid(),
  workflow_id text not null,
  user_id text not null,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  granted_by text,
  created_at timestamptz not null default now(),
  unique (workflow_id, user_id)
);

create index if not exists ida_workflow_permissions_workflow_idx
  on ida_workflow_permissions (workflow_id);

create index if not exists ida_workflow_permissions_user_idx
  on ida_workflow_permissions (user_id);

create table if not exists ida_workflow_audit_logs (
  id uuid primary key default gen_random_uuid(),
  workflow_id text,
  workflow_name text,
  user_id text,
  session_id text,
  action text not null,
  actor_type text not null default 'user'
    check (actor_type in ('user', 'system', 'admin')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ida_workflow_audit_logs_workflow_idx
  on ida_workflow_audit_logs (workflow_id);

create index if not exists ida_workflow_audit_logs_user_idx
  on ida_workflow_audit_logs (user_id);

create index if not exists ida_workflow_audit_logs_action_idx
  on ida_workflow_audit_logs (action);

create index if not exists ida_workflow_audit_logs_created_at_idx
  on ida_workflow_audit_logs (created_at desc);