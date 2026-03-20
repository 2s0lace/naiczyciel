-- Rate limits for AI endpoints
-- Safe to run multiple times in Supabase SQL Editor.

begin;

create table if not exists public.rate_limits (
  user_id text not null,
  action text not null,
  count integer not null default 0,
  window_start timestamptz not null,
  primary key (user_id, action, window_start)
);

alter table public.rate_limits add column if not exists user_id text;
alter table public.rate_limits add column if not exists action text;
alter table public.rate_limits add column if not exists count integer not null default 0;
alter table public.rate_limits add column if not exists window_start timestamptz not null;

create unique index if not exists rate_limits_user_action_window_uidx
  on public.rate_limits (user_id, action, window_start);
create index if not exists rate_limits_action_window_idx
  on public.rate_limits (action, window_start desc);

alter table public.rate_limits enable row level security;

drop policy if exists rate_limits_select_all on public.rate_limits;
create policy rate_limits_select_all
  on public.rate_limits
  for select
  to anon, authenticated
  using (true);

drop policy if exists rate_limits_insert_all on public.rate_limits;
create policy rate_limits_insert_all
  on public.rate_limits
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists rate_limits_update_all on public.rate_limits;
create policy rate_limits_update_all
  on public.rate_limits
  for update
  to anon, authenticated
  using (true)
  with check (true);

grant select, insert, update on public.rate_limits to anon, authenticated;

commit;
