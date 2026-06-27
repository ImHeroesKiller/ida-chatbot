-- Per-user anonymous sessions (device UUID) + UI chat history

create table if not exists ida_user_chat_state (
  user_id text primary key,
  current_chat_id text not null,
  chat_order text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table ida_chat_sessions
  add column if not exists user_id text,
  add column if not exists chat_id text,
  add column if not exists title text,
  add column if not exists quick_replies jsonb not null default '[]'::jsonb,
  add column if not exists pinned boolean not null default false,
  add column if not exists chat_created_at timestamptz,
  add column if not exists chat_updated_at timestamptz;

alter table ida_chat_sessions
  drop constraint if exists ida_chat_sessions_user_chat_key;

alter table ida_chat_sessions
  add constraint ida_chat_sessions_user_chat_key unique (user_id, chat_id);

create unique index if not exists ida_chat_sessions_user_session_unique
  on ida_chat_sessions (user_id, session_id)
  where user_id is not null;

create index if not exists ida_chat_sessions_user_id_idx
  on ida_chat_sessions (user_id);