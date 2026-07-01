-- IDA RAG — full schema (run once in Supabase SQL Editor)
-- Equivalent to migrations 001 + 002 in order.

create extension if not exists vector;

create table if not exists ida_document_chunks (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  embedding vector(768) not null,
  locale text not null check (locale in ('id', 'en', 'zh')),
  page_slug text not null,
  section text not null,
  source_type text not null check (source_type in ('knowledge', 'faq', 'guide')),
  metadata jsonb not null default '{}'::jsonb,
  content_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ida_document_chunks_hash_idx
  on ida_document_chunks (content_hash);

create index if not exists ida_document_chunks_locale_idx
  on ida_document_chunks (locale);

create index if not exists ida_document_chunks_page_slug_idx
  on ida_document_chunks (page_slug);

create index if not exists ida_document_chunks_embedding_idx
  on ida_document_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create table if not exists ida_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  locale text not null check (locale in ('id', 'en', 'zh')),
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ida_chat_sessions_session_id_idx
  on ida_chat_sessions (session_id);

-- RPC used by lib/rag/vector-store.ts (includes metadata for RAG context)
-- Must drop first when return type changes (migration 001 → 002).
drop function if exists match_ida_chunks(vector, text, integer, double precision);
drop function if exists match_ida_chunks(vector, text, int, float);

create or replace function match_ida_chunks(
  query_embedding vector(768),
  match_locale text,
  match_count int default 6,
  match_threshold float default 0.35
)
returns table (
  id uuid,
  content text,
  page_slug text,
  section text,
  source_type text,
  metadata jsonb,
  similarity float
)
language sql
stable
as $$
  select
    ida_document_chunks.id,
    ida_document_chunks.content,
    ida_document_chunks.page_slug,
    ida_document_chunks.section,
    ida_document_chunks.source_type,
    ida_document_chunks.metadata,
    1 - (ida_document_chunks.embedding <=> query_embedding) as similarity
  from ida_document_chunks
  where ida_document_chunks.locale = match_locale
    and 1 - (ida_document_chunks.embedding <=> query_embedding) > match_threshold
  order by ida_document_chunks.embedding <=> query_embedding
  limit match_count;
$$;

-- Migration 003: per-user anonymous sessions (device UUID) + UI chat history

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

-- Migration 004: admin panel (request logs + app config)

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

-- Migration 005: token usage + request status

alter table ida_request_logs
  add column if not exists prompt_tokens int not null default 0,
  add column if not exists completion_tokens int not null default 0,
  add column if not exists total_tokens int not null default 0,
  add column if not exists status text not null default 'success',
  add column if not exists error_message text;

create index if not exists ida_request_logs_status_idx
  on ida_request_logs (status);

create index if not exists ida_request_logs_created_status_idx
  on ida_request_logs (created_at desc, status);

-- Migration 007: global UI/UX configuration

create table if not exists ida_ui_config (
  id text primary key default 'global',
  theme text not null default 'system'
    check (theme in ('light', 'dark', 'system')),
  font_size text not null default 'medium'
    check (font_size in ('small', 'medium', 'large')),
  density text not null default 'comfortable'
    check (density in ('compact', 'comfortable', 'spacious')),
  animation_level text not null default 'full'
    check (animation_level in ('full', 'reduced', 'none')),
  primary_color text not null default '#171717',
  message_max_width text not null default '42rem',
  updated_at timestamptz not null default now()
);

insert into ida_ui_config (id)
values ('global')
on conflict (id) do nothing;

-- Migration 008: knowledge base document registry

create table if not exists ida_kb_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  file_name text not null,
  file_type text not null check (file_type in ('pdf', 'txt', 'md', 'docx')),
  locale text not null check (locale in ('id', 'en', 'zh')),
  page_slug text not null,
  section text not null,
  source_type text not null check (source_type in ('knowledge', 'faq', 'guide')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  chunk_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ida_kb_documents_slug_section_locale_idx
  on ida_kb_documents (page_slug, section, locale);

create index if not exists ida_kb_documents_page_slug_idx
  on ida_kb_documents (page_slug);

create index if not exists ida_kb_documents_updated_at_idx
  on ida_kb_documents (updated_at desc);

-- Migration 009: authenticated users (Google OAuth)

create table if not exists ida_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

create index if not exists ida_users_email_idx on ida_users (email);

-- Migration 010: worksheet public share links

create table if not exists ida_worksheet_shares (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  locale text not null check (locale in ('id', 'en', 'zh')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists ida_worksheet_shares_expires_at_idx
  on ida_worksheet_shares (expires_at);

-- Migration 013: worksheet workspace per chat session

alter table ida_chat_sessions
  add column if not exists worksheet jsonb,
  add column if not exists active_right_panel text,
  add column if not exists worksheet_tool_enabled boolean not null default false;

-- Migration 014: web search tool toggle per chat session

alter table ida_chat_sessions
  add column if not exists web_search_enabled boolean not null default false;

-- Migration 015: research tool per chat session

alter table ida_chat_sessions
  add column if not exists research_enabled boolean not null default false;

alter table ida_chat_sessions
  add column if not exists research_sessions jsonb not null default '[]'::jsonb;

-- Migration 016: map tool per chat session

alter table ida_chat_sessions
  add column if not exists map_enabled boolean not null default false;

alter table ida_chat_sessions
  add column if not exists map_view_state jsonb not null default '{}'::jsonb;

-- Migration 018: workflow workspace per chat session

alter table ida_chat_sessions
  add column if not exists workflow jsonb,
  add column if not exists workflow_tool_enabled boolean not null default false;

-- Migration 019: user workflow templates

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

-- Migration 017: user profile preferences

alter table ida_users
  add column if not exists custom_prompt text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Migration 020: workflow security ACL and audit trail (Phase 3.3)

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