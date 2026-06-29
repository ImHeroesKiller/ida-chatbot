-- User profile preferences: custom prompt + avatar storage

alter table ida_users
  add column if not exists custom_prompt text;

comment on column ida_users.custom_prompt is
  'User-defined system instruction appended to IDA chat responses';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;