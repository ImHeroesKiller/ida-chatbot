-- Persist research tool toggle and saved research sessions per chat

alter table ida_chat_sessions
  add column if not exists research_enabled boolean not null default false;

alter table ida_chat_sessions
  add column if not exists research_sessions jsonb not null default '[]'::jsonb;