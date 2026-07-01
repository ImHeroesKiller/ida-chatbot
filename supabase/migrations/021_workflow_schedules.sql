-- Workflow schedules, trigger events, and pg_cron helper (Phase 3.4)

create table if not exists ida_workflow_schedules (
  id uuid primary key default gen_random_uuid(),
  workflow_id text not null,
  workflow_name text,
  trigger_node_id text not null,
  session_id text,
  user_id text,
  schedule_type text not null
    check (schedule_type in (
      'immediate', 'delay', 'daily', 'weekly', 'monthly',
      'event_email', 'event_webhook', 'event_calendar'
    )),
  schedule_config jsonb not null default '{}'::jsonb,
  cron_expression text,
  next_run_at timestamptz,
  last_run_at timestamptz,
  enabled boolean not null default true,
  webhook_token text unique,
  run_count integer not null default 0,
  workflow_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workflow_id, trigger_node_id)
);

create index if not exists ida_workflow_schedules_workflow_idx
  on ida_workflow_schedules (workflow_id);

create index if not exists ida_workflow_schedules_next_run_idx
  on ida_workflow_schedules (next_run_at)
  where enabled = true and next_run_at is not null;

create index if not exists ida_workflow_schedules_type_idx
  on ida_workflow_schedules (schedule_type);

create index if not exists ida_workflow_schedules_webhook_token_idx
  on ida_workflow_schedules (webhook_token)
  where webhook_token is not null;

create table if not exists ida_workflow_trigger_events (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid references ida_workflow_schedules (id) on delete set null,
  workflow_id text,
  event_type text not null
    check (event_type in ('cron_tick', 'webhook', 'email', 'calendar', 'manual', 'delay')),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'dispatched', 'failed', 'skipped')),
  created_at timestamptz not null default now()
);

create index if not exists ida_workflow_trigger_events_schedule_idx
  on ida_workflow_trigger_events (schedule_id);

create index if not exists ida_workflow_trigger_events_workflow_idx
  on ida_workflow_trigger_events (workflow_id);

create index if not exists ida_workflow_trigger_events_created_at_idx
  on ida_workflow_trigger_events (created_at desc);

-- Optional pg_cron job (enable pg_cron in Supabase Dashboard first):
-- select cron.schedule(
--   'ida-workflow-scheduler-tick',
--   '* * * * *',
--   $$ select net.http_post(
--        url := '<APP_URL>/api/workflow/scheduler/tick',
--        headers := '{"Authorization":"Bearer <WORKFLOW_SCHEDULER_SECRET>"}'::jsonb,
--        body := '{}'::jsonb
--      ) as request_id; $$
-- );