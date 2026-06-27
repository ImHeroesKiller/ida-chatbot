-- Knowledge Base Management: uploaded document registry

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