-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

-- Tables
create table if not exists public.quiz_sessions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_type text not null default 'e8',
  score integer not null,
  total_questions integer not null,
  percent integer not null,
  duration_seconds integer,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_answers (
  id bigint generated always as identity primary key,
  session_id bigint not null references public.quiz_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text,
  branch text,
  question_text text,
  selected_answer text,
  correct_answer text,
  is_correct boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists quiz_sessions_user_id_idx on public.quiz_sessions(user_id);
create index if not exists quiz_sessions_quiz_type_idx on public.quiz_sessions(quiz_type);
create index if not exists quiz_answers_user_id_idx on public.quiz_answers(user_id);
create index if not exists quiz_answers_session_id_idx on public.quiz_answers(session_id);

-- RLS
alter table public.quiz_sessions enable row level security;
alter table public.quiz_answers enable row level security;

-- Policies: user sees only own data
create policy if not exists "quiz_sessions_select_own"
  on public.quiz_sessions
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy if not exists "quiz_sessions_insert_own"
  on public.quiz_sessions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy if not exists "quiz_answers_select_own"
  on public.quiz_answers
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy if not exists "quiz_answers_insert_own"
  on public.quiz_answers
  for insert
  to authenticated
  with check (auth.uid() = user_id);
