-- Persist map tool toggle and map view state per chat

alter table ida_chat_sessions
  add column if not exists map_enabled boolean not null default false;

alter table ida_chat_sessions
  add column if not exists map_view_state jsonb not null default '{}'::jsonb;