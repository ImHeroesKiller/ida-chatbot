-- User-saved workflow templates (per authenticated user)

create table if not exists ida_workflow_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  category text not null default 'custom',
  definition jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ida_workflow_templates_user_id_idx
  on ida_workflow_templates (user_id);

create index if not exists ida_workflow_templates_name_idx
  on ida_workflow_templates (name);