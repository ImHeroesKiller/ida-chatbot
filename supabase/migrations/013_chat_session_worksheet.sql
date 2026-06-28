-- Persist worksheet workspace per chat session (survives hard refresh / remote sync)

alter table ida_chat_sessions
  add column if not exists worksheet jsonb,
  add column if not exists active_right_panel text,
  add column if not exists worksheet_tool_enabled boolean not null default false;