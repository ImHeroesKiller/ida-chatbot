-- Media models for image/video/music generation
-- Allows admin to manage custom model configs for creative tools

create table if not exists ida_media_models (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('image', 'video', 'music')),
  name text not null,
  provider text not null,
  model_id text not null,
  api_endpoint text,
  is_active boolean not null default true,
  default_settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ida_media_models_category_idx on ida_media_models (category);
create index if not exists ida_media_models_active_idx on ida_media_models (is_active);

-- RLS: only admins can manage, but for now allow service role (admin apis use service key)
-- If needed, add policies later.

comment on table ida_media_models is 'Custom media generation models managed in Admin > Media Models';
comment on column ida_media_models.default_settings is 'JSON for extra params like steps, guidance_scale, etc. Provider specific.';
