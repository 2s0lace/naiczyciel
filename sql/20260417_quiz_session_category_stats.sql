-- Persist canonical 4-category stats per completed quiz session.
-- Safe to run multiple times in Supabase SQL Editor.

begin;

create table if not exists public.quiz_session_category_stats (
  session_id text not null references public.quiz_sessions(id) on delete cascade,
  category_key text not null,
  category_label text not null,
  attempts integer not null default 0,
  correct_answers integer not null default 0,
  percent numeric(5,2),
  has_data boolean not null default false,
  synced_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (session_id, category_key)
);

alter table public.quiz_session_category_stats add column if not exists session_id text;
alter table public.quiz_session_category_stats add column if not exists category_key text;
alter table public.quiz_session_category_stats add column if not exists category_label text;
alter table public.quiz_session_category_stats add column if not exists attempts integer not null default 0;
alter table public.quiz_session_category_stats add column if not exists correct_answers integer not null default 0;
alter table public.quiz_session_category_stats add column if not exists percent numeric(5,2);
alter table public.quiz_session_category_stats add column if not exists has_data boolean not null default false;
alter table public.quiz_session_category_stats add column if not exists synced_at timestamptz not null default timezone('utc', now());
alter table public.quiz_session_category_stats add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.quiz_session_category_stats add column if not exists updated_at timestamptz not null default timezone('utc', now());

create index if not exists quiz_session_category_stats_session_idx
  on public.quiz_session_category_stats (session_id);
create index if not exists quiz_session_category_stats_category_idx
  on public.quiz_session_category_stats (category_key, synced_at desc);

drop trigger if exists trg_quiz_session_category_stats_touch_updated_at on public.quiz_session_category_stats;
create trigger trg_quiz_session_category_stats_touch_updated_at
before update on public.quiz_session_category_stats
for each row
execute function public.touch_updated_at();

alter table public.quiz_session_category_stats enable row level security;

drop policy if exists quiz_session_category_stats_select_all on public.quiz_session_category_stats;
create policy quiz_session_category_stats_select_all
  on public.quiz_session_category_stats
  for select
  to anon, authenticated
  using (true);

drop policy if exists quiz_session_category_stats_insert_all on public.quiz_session_category_stats;
create policy quiz_session_category_stats_insert_all
  on public.quiz_session_category_stats
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists quiz_session_category_stats_update_all on public.quiz_session_category_stats;
create policy quiz_session_category_stats_update_all
  on public.quiz_session_category_stats
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists quiz_session_category_stats_delete_all on public.quiz_session_category_stats;
create policy quiz_session_category_stats_delete_all
  on public.quiz_session_category_stats
  for delete
  to anon, authenticated
  using (true);

grant select, insert, update on public.quiz_session_category_stats to anon, authenticated;

commit;
