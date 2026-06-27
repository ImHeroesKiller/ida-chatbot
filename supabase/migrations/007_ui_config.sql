-- Global UI/UX configuration (admin-controlled)

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