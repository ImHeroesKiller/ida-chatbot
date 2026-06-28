-- Company letterhead templates for Worksheet (admin-managed, org-wide)

create table if not exists ida_worksheet_letterhead_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  branding_config jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ida_worksheet_letterhead_templates_name_idx
  on ida_worksheet_letterhead_templates (name);

create unique index if not exists ida_worksheet_letterhead_templates_one_default_idx
  on ida_worksheet_letterhead_templates (is_default)
  where is_default = true;