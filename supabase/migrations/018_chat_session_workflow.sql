-- Persist workflow workspace per chat session (survives hard refresh / remote sync)

alter table ida_chat_sessions
  add column if not exists workflow jsonb,
  add column if not exists workflow_tool_enabled boolean not null default false;