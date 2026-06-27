-- Authenticated users (Google OAuth via Supabase Auth)

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

comment on table ida_users is 'Profile mirror for Supabase Auth users';
comment on column ida_chat_sessions.user_id is 'Auth user UUID or legacy anonymous device UUID';