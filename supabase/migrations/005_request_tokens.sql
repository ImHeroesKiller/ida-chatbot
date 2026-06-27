-- Token usage, status, and error tracking for request logs

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