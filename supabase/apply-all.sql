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