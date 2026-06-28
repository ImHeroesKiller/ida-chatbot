-- Persist web search tool toggle per chat session

alter table ida_chat_sessions
  add column if not exists web_search_enabled boolean not null default false;