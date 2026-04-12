-- E8 panel SQL sync
-- Safe to run multiple times in Supabase SQL Editor.

begin;

create extension if not exists pgcrypto;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.fill_quiz_session_user_id()
returns trigger
language plpgsql
as $$
begin
  if new.user_id is null then
    new.user_id = auth.uid();
  end if;

  return new;
end;
$$;

create or replace function public.is_admin_jwt()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role', '')) = 'admin';
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text,
  access_level text,
  premium_until timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists role text;
alter table public.profiles add column if not exists access_level text;
alter table public.profiles add column if not exists premium_until timestamptz;
alter table public.profiles add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.profiles add column if not exists updated_at timestamptz not null default timezone('utc', now());

create index if not exists profiles_email_idx on public.profiles (lower(email));

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid() or public.is_admin_jwt());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid() or public.is_admin_jwt());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid() or public.is_admin_jwt())
  with check (id = auth.uid() or public.is_admin_jwt());

do $$
begin
  if to_regclass('public.users') is not null then
    execute 'alter table public.users add column if not exists role text';
    execute 'alter table public.users add column if not exists access_level text';
    execute 'alter table public.users add column if not exists premium_until timestamptz';
  end if;
end;
$$;

create table if not exists public.quiz_sessions (
  id text primary key default gen_random_uuid()::text,
  user_id uuid references auth.users(id) on delete set null,
  mode text not null default 'reactions',
  status text not null default 'in_progress',
  requested_count integer not null default 10,
  total_questions integer,
  correct_answers integer,
  score_percent numeric(5,2),
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.quiz_sessions add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.quiz_sessions alter column user_id drop not null;
alter table public.quiz_sessions add column if not exists mode text not null default 'reactions';
alter table public.quiz_sessions add column if not exists status text not null default 'in_progress';
alter table public.quiz_sessions add column if not exists requested_count integer not null default 10;
alter table public.quiz_sessions add column if not exists total_questions integer;
alter table public.quiz_sessions add column if not exists correct_answers integer;
alter table public.quiz_sessions add column if not exists score_percent numeric(5,2);
alter table public.quiz_sessions add column if not exists started_at timestamptz not null default timezone('utc', now());
alter table public.quiz_sessions add column if not exists completed_at timestamptz;
alter table public.quiz_sessions add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.quiz_sessions add column if not exists updated_at timestamptz not null default timezone('utc', now());
alter table public.quiz_sessions add column if not exists branch text not null default 'e8';

create index if not exists quiz_sessions_user_created_idx on public.quiz_sessions (user_id, created_at desc);
create index if not exists quiz_sessions_mode_created_idx on public.quiz_sessions (mode, created_at desc);
create index if not exists quiz_sessions_status_idx on public.quiz_sessions (status);

do $$
declare
  legacy_col text;
begin
  foreach legacy_col in array array['profile_id', 'owner_id', 'student_id'] loop
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'quiz_sessions'
        and column_name = legacy_col
    ) then
      execute format(
        'update public.quiz_sessions
           set user_id = %1$I::uuid
         where user_id is null
           and %1$I is not null
           and %1$I::text ~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$''',
        legacy_col
      );
    end if;
  end loop;
exception
  when others then
    null;
end;
$$;
drop trigger if exists trg_quiz_sessions_touch_updated_at on public.quiz_sessions;
create trigger trg_quiz_sessions_touch_updated_at
before update on public.quiz_sessions
for each row
execute function public.touch_updated_at();

drop trigger if exists trg_quiz_sessions_fill_user_id on public.quiz_sessions;
create trigger trg_quiz_sessions_fill_user_id
before insert on public.quiz_sessions
for each row
execute function public.fill_quiz_session_user_id();

alter table public.quiz_sessions enable row level security;

drop policy if exists quiz_sessions_select_all on public.quiz_sessions;
create policy quiz_sessions_select_all
  on public.quiz_sessions
  for select
  to anon, authenticated
  using (true);

drop policy if exists quiz_sessions_insert_all on public.quiz_sessions;
create policy quiz_sessions_insert_all
  on public.quiz_sessions
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists quiz_sessions_update_all on public.quiz_sessions;
create policy quiz_sessions_update_all
  on public.quiz_sessions
  for update
  to anon, authenticated
  using (true)
  with check (true);

create table if not exists public.quiz_session_answers (
  session_id text not null,
  question_id text not null,
  option_id text,
  selected_option_id text,
  is_correct boolean not null default false,
  answered_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (session_id, question_id)
);

alter table public.quiz_session_answers add column if not exists session_id text;
alter table public.quiz_session_answers add column if not exists question_id text;
alter table public.quiz_session_answers add column if not exists option_id text;
alter table public.quiz_session_answers add column if not exists selected_option_id text;
alter table public.quiz_session_answers add column if not exists is_correct boolean not null default false;
alter table public.quiz_session_answers add column if not exists answered_at timestamptz not null default timezone('utc', now());
alter table public.quiz_session_answers add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.quiz_session_answers add column if not exists updated_at timestamptz not null default timezone('utc', now());

create unique index if not exists quiz_session_answers_session_question_uidx
  on public.quiz_session_answers (session_id, question_id);
create index if not exists quiz_session_answers_session_idx on public.quiz_session_answers (session_id);
create index if not exists quiz_session_answers_question_idx on public.quiz_session_answers (question_id);

drop trigger if exists trg_quiz_session_answers_touch_updated_at on public.quiz_session_answers;
create trigger trg_quiz_session_answers_touch_updated_at
before update on public.quiz_session_answers
for each row
execute function public.touch_updated_at();

alter table public.quiz_session_answers enable row level security;

drop policy if exists quiz_session_answers_select_all on public.quiz_session_answers;
create policy quiz_session_answers_select_all
  on public.quiz_session_answers
  for select
  to anon, authenticated
  using (true);

drop policy if exists quiz_session_answers_insert_all on public.quiz_session_answers;
create policy quiz_session_answers_insert_all
  on public.quiz_session_answers
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists quiz_session_answers_update_all on public.quiz_session_answers;
create policy quiz_session_answers_update_all
  on public.quiz_session_answers
  for update
  to anon, authenticated
  using (true)
  with check (true);

create table if not exists public.quiz_result_stats (
  id bigserial primary key,
  session_id text not null,
  mode text,
  total_questions integer,
  correct_answers integer,
  score_percent numeric(5,2),
  synced_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.quiz_result_stats add column if not exists session_id text;
alter table public.quiz_result_stats add column if not exists mode text;
alter table public.quiz_result_stats add column if not exists total_questions integer;
alter table public.quiz_result_stats add column if not exists correct_answers integer;
alter table public.quiz_result_stats add column if not exists score_percent numeric(5,2);
alter table public.quiz_result_stats add column if not exists synced_at timestamptz not null default timezone('utc', now());
alter table public.quiz_result_stats add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.quiz_result_stats add column if not exists updated_at timestamptz not null default timezone('utc', now());

create index if not exists quiz_result_stats_session_synced_idx on public.quiz_result_stats (session_id, synced_at desc);

drop trigger if exists trg_quiz_result_stats_touch_updated_at on public.quiz_result_stats;
create trigger trg_quiz_result_stats_touch_updated_at
before update on public.quiz_result_stats
for each row
execute function public.touch_updated_at();

alter table public.quiz_result_stats enable row level security;

drop policy if exists quiz_result_stats_select_all on public.quiz_result_stats;
create policy quiz_result_stats_select_all
  on public.quiz_result_stats
  for select
  to anon, authenticated
  using (true);

drop policy if exists quiz_result_stats_insert_all on public.quiz_result_stats;
create policy quiz_result_stats_insert_all
  on public.quiz_result_stats
  for insert
  to anon, authenticated
  with check (true);

create table if not exists public.quiz_exercises (
  id text primary key,
  status text not null default 'draft',
  category text not null default 'reactions',
  task_type text not null default 'single_choice_short',
  difficulty text not null default 'easy',
  tags text[] not null default '{}'::text[],
  source text not null default 'internal',
  is_public boolean not null default true,
  title text not null default '',
  instruction text not null default 'Choose the best answer.',
  content jsonb not null default '{}'::jsonb,
  correct_answer jsonb not null default '{}'::jsonb,
  explanation jsonb not null default '{}'::jsonb,
  hint jsonb not null default '{}'::jsonb,
  analytics jsonb not null default '{}'::jsonb,
  meta jsonb not null default '{}'::jsonb,
  payload jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.quiz_exercises add column if not exists status text not null default 'draft';
alter table public.quiz_exercises add column if not exists category text not null default 'reactions';
alter table public.quiz_exercises add column if not exists task_type text not null default 'single_choice_short';
alter table public.quiz_exercises add column if not exists difficulty text not null default 'easy';
alter table public.quiz_exercises add column if not exists tags text[] not null default '{}'::text[];
alter table public.quiz_exercises add column if not exists source text not null default 'internal';
alter table public.quiz_exercises add column if not exists is_public boolean not null default true;
alter table public.quiz_exercises add column if not exists title text not null default '';
alter table public.quiz_exercises add column if not exists instruction text not null default 'Choose the best answer.';
alter table public.quiz_exercises add column if not exists content jsonb not null default '{}'::jsonb;
alter table public.quiz_exercises add column if not exists correct_answer jsonb not null default '{}'::jsonb;
alter table public.quiz_exercises add column if not exists explanation jsonb not null default '{}'::jsonb;
alter table public.quiz_exercises add column if not exists hint jsonb not null default '{}'::jsonb;
alter table public.quiz_exercises add column if not exists analytics jsonb not null default '{}'::jsonb;
alter table public.quiz_exercises add column if not exists meta jsonb not null default '{}'::jsonb;
alter table public.quiz_exercises add column if not exists payload jsonb;
alter table public.quiz_exercises add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.quiz_exercises add column if not exists updated_at timestamptz not null default timezone('utc', now());

create index if not exists quiz_exercises_status_category_idx on public.quiz_exercises (status, category);
create index if not exists quiz_exercises_updated_idx on public.quiz_exercises (updated_at desc);

drop trigger if exists trg_quiz_exercises_touch_updated_at on public.quiz_exercises;
create trigger trg_quiz_exercises_touch_updated_at
before update on public.quiz_exercises
for each row
execute function public.touch_updated_at();

alter table public.quiz_exercises enable row level security;

drop policy if exists quiz_exercises_select_all on public.quiz_exercises;
create policy quiz_exercises_select_all
  on public.quiz_exercises
  for select
  to anon, authenticated
  using (true);

drop policy if exists quiz_exercises_write_admin on public.quiz_exercises;
create policy quiz_exercises_write_admin
  on public.quiz_exercises
  for all
  to authenticated
  using (public.is_admin_jwt())
  with check (public.is_admin_jwt());

create table if not exists public.quiz_questions (
  id text primary key,
  mode text not null default 'reactions',
  category text not null default 'Reakcje',
  prompt text,
  question text,
  explanation text,
  pattern_tip text,
  warning_tip text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.quiz_questions add column if not exists mode text not null default 'reactions';
alter table public.quiz_questions add column if not exists category text not null default 'Reakcje';
alter table public.quiz_questions add column if not exists prompt text;
alter table public.quiz_questions add column if not exists question text;
alter table public.quiz_questions add column if not exists explanation text;
alter table public.quiz_questions add column if not exists pattern_tip text;
alter table public.quiz_questions add column if not exists warning_tip text;
alter table public.quiz_questions add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.quiz_questions add column if not exists updated_at timestamptz not null default timezone('utc', now());

create index if not exists quiz_questions_mode_idx on public.quiz_questions (mode);

drop trigger if exists trg_quiz_questions_touch_updated_at on public.quiz_questions;
create trigger trg_quiz_questions_touch_updated_at
before update on public.quiz_questions
for each row
execute function public.touch_updated_at();

alter table public.quiz_questions enable row level security;

drop policy if exists quiz_questions_select_all on public.quiz_questions;
create policy quiz_questions_select_all
  on public.quiz_questions
  for select
  to anon, authenticated
  using (true);

drop policy if exists quiz_questions_write_admin on public.quiz_questions;
create policy quiz_questions_write_admin
  on public.quiz_questions
  for all
  to authenticated
  using (public.is_admin_jwt())
  with check (public.is_admin_jwt());

create table if not exists public.quiz_options (
  id text primary key,
  question_id text not null references public.quiz_questions(id) on delete cascade,
  label text,
  text text,
  option_text text,
  content text,
  is_correct boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.quiz_options add column if not exists question_id text;
alter table public.quiz_options add column if not exists label text;
alter table public.quiz_options add column if not exists text text;
alter table public.quiz_options add column if not exists option_text text;
alter table public.quiz_options add column if not exists content text;
alter table public.quiz_options add column if not exists is_correct boolean not null default false;
alter table public.quiz_options add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.quiz_options add column if not exists updated_at timestamptz not null default timezone('utc', now());

create index if not exists quiz_options_question_idx on public.quiz_options (question_id);

drop trigger if exists trg_quiz_options_touch_updated_at on public.quiz_options;
create trigger trg_quiz_options_touch_updated_at
before update on public.quiz_options
for each row
execute function public.touch_updated_at();

alter table public.quiz_options enable row level security;

drop policy if exists quiz_options_select_all on public.quiz_options;
create policy quiz_options_select_all
  on public.quiz_options
  for select
  to anon, authenticated
  using (true);

drop policy if exists quiz_options_write_admin on public.quiz_options;
create policy quiz_options_write_admin
  on public.quiz_options
  for all
  to authenticated
  using (public.is_admin_jwt())
  with check (public.is_admin_jwt());

create table if not exists public.quiz_set_access_state (
  id text primary key,
  sets jsonb not null default '[]'::jsonb,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.quiz_set_access_state add column if not exists sets jsonb not null default '[]'::jsonb;
alter table public.quiz_set_access_state add column if not exists config jsonb not null default '{}'::jsonb;
alter table public.quiz_set_access_state add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.quiz_set_access_state add column if not exists updated_at timestamptz not null default timezone('utc', now());

create index if not exists quiz_set_access_state_updated_idx on public.quiz_set_access_state (updated_at desc);

drop trigger if exists trg_quiz_set_access_state_touch_updated_at on public.quiz_set_access_state;
create trigger trg_quiz_set_access_state_touch_updated_at
before update on public.quiz_set_access_state
for each row
execute function public.touch_updated_at();

alter table public.quiz_set_access_state enable row level security;

drop policy if exists quiz_set_access_state_select_all on public.quiz_set_access_state;
create policy quiz_set_access_state_select_all
  on public.quiz_set_access_state
  for select
  to anon, authenticated
  using (true);

drop policy if exists quiz_set_access_state_write_admin on public.quiz_set_access_state;
create policy quiz_set_access_state_write_admin
  on public.quiz_set_access_state
  for all
  to authenticated
  using (public.is_admin_jwt())
  with check (public.is_admin_jwt());

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
create index if not exists rate_limits_action_window_idx on public.rate_limits (action, window_start desc);

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

grant select on public.quiz_exercises, public.quiz_questions, public.quiz_options to anon, authenticated;
grant select, insert, update on public.quiz_sessions, public.quiz_session_answers, public.quiz_result_stats to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.quiz_set_access_state to anon, authenticated;
grant insert, update, delete on public.quiz_set_access_state to authenticated;
grant select, insert, update on public.rate_limits to anon, authenticated;

do $$
begin
  if to_regclass('public.quiz_result_stats_id_seq') is not null then
    execute 'grant usage, select on sequence public.quiz_result_stats_id_seq to anon, authenticated';
  end if;
end;
$$;

commit;









