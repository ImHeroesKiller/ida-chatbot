-- Admin panel: request logs + app configuration

create table if not exists ida_request_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  session_id text,
  model text not null,
  provider text not null,
  route text not null default 'chat',
  created_at timestamptz not null default now()
);

create index if not exists ida_request_logs_created_at_idx
  on ida_request_logs (created_at desc);

create index if not exists ida_request_logs_user_id_idx
  on ida_request_logs (user_id);

create index if not exists ida_request_logs_model_idx
  on ida_request_logs (model);

create index if not exists ida_request_logs_provider_idx
  on ida_request_logs (provider);

create table if not exists ida_app_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);