-- Worksheet public share links (persistent, TTL-based expiry)

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