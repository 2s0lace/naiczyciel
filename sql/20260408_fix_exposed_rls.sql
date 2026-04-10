-- Lock down exposed quiz/session RLS policies.
-- Forward-only migration. Do not edit older migrations.

begin;

-- Remove overly broad grants first.
revoke all on public.quiz_sessions from anon;
revoke all on public.quiz_session_answers from anon;
revoke all on public.quiz_result_stats from anon;
revoke all on public.rate_limits from anon;

revoke all on public.quiz_sessions from authenticated;
revoke all on public.quiz_session_answers from authenticated;
revoke all on public.quiz_result_stats from authenticated;
revoke all on public.rate_limits from authenticated;

-- Re-grant only the operations supported by the tighter policies below.
grant select, insert, update on public.quiz_sessions to authenticated;
grant select, insert, update on public.quiz_session_answers to authenticated;
grant select, insert, update on public.quiz_result_stats to authenticated;
grant select, insert, update on public.rate_limits to authenticated;

-- quiz_sessions: only owners and admins can read/write.
drop policy if exists quiz_sessions_select_all on public.quiz_sessions;
drop policy if exists quiz_sessions_insert_all on public.quiz_sessions;
drop policy if exists quiz_sessions_update_all on public.quiz_sessions;
drop policy if exists quiz_sessions_select_own on public.quiz_sessions;
drop policy if exists quiz_sessions_insert_own on public.quiz_sessions;
drop policy if exists quiz_sessions_update_own on public.quiz_sessions;

create policy quiz_sessions_select_own
  on public.quiz_sessions
  for select
  to authenticated
  using (
    public.is_admin_jwt()
    or user_id = auth.uid()
  );

create policy quiz_sessions_insert_own
  on public.quiz_sessions
  for insert
  to authenticated
  with check (
    public.is_admin_jwt()
    or coalesce(user_id, auth.uid()) = auth.uid()
  );

create policy quiz_sessions_update_own
  on public.quiz_sessions
  for update
  to authenticated
  using (
    public.is_admin_jwt()
    or user_id = auth.uid()
  )
  with check (
    public.is_admin_jwt()
    or user_id = auth.uid()
  );

-- quiz_session_answers: access only through owned/admin-visible sessions.
drop policy if exists quiz_session_answers_select_all on public.quiz_session_answers;
drop policy if exists quiz_session_answers_insert_all on public.quiz_session_answers;
drop policy if exists quiz_session_answers_update_all on public.quiz_session_answers;
drop policy if exists quiz_session_answers_select_own on public.quiz_session_answers;
drop policy if exists quiz_session_answers_insert_own on public.quiz_session_answers;
drop policy if exists quiz_session_answers_update_own on public.quiz_session_answers;

create policy quiz_session_answers_select_own
  on public.quiz_session_answers
  for select
  to authenticated
  using (
    public.is_admin_jwt()
    or exists (
      select 1
      from public.quiz_sessions s
      where s.id = quiz_session_answers.session_id
        and s.user_id = auth.uid()
    )
  );

create policy quiz_session_answers_insert_own
  on public.quiz_session_answers
  for insert
  to authenticated
  with check (
    public.is_admin_jwt()
    or exists (
      select 1
      from public.quiz_sessions s
      where s.id = quiz_session_answers.session_id
        and s.user_id = auth.uid()
    )
  );

create policy quiz_session_answers_update_own
  on public.quiz_session_answers
  for update
  to authenticated
  using (
    public.is_admin_jwt()
    or exists (
      select 1
      from public.quiz_sessions s
      where s.id = quiz_session_answers.session_id
        and s.user_id = auth.uid()
    )
  )
  with check (
    public.is_admin_jwt()
    or exists (
      select 1
      from public.quiz_sessions s
      where s.id = quiz_session_answers.session_id
        and s.user_id = auth.uid()
    )
  );

-- quiz_result_stats: tied to an owned/admin-visible session.
drop policy if exists quiz_result_stats_select_all on public.quiz_result_stats;
drop policy if exists quiz_result_stats_insert_all on public.quiz_result_stats;
drop policy if exists quiz_result_stats_update_all on public.quiz_result_stats;
drop policy if exists quiz_result_stats_select_own on public.quiz_result_stats;
drop policy if exists quiz_result_stats_insert_own on public.quiz_result_stats;
drop policy if exists quiz_result_stats_update_own on public.quiz_result_stats;

create policy quiz_result_stats_select_own
  on public.quiz_result_stats
  for select
  to authenticated
  using (
    public.is_admin_jwt()
    or exists (
      select 1
      from public.quiz_sessions s
      where s.id = quiz_result_stats.session_id
        and s.user_id = auth.uid()
    )
  );

create policy quiz_result_stats_insert_own
  on public.quiz_result_stats
  for insert
  to authenticated
  with check (
    public.is_admin_jwt()
    or exists (
      select 1
      from public.quiz_sessions s
      where s.id = quiz_result_stats.session_id
        and s.user_id = auth.uid()
    )
  );

create policy quiz_result_stats_update_own
  on public.quiz_result_stats
  for update
  to authenticated
  using (
    public.is_admin_jwt()
    or exists (
      select 1
      from public.quiz_sessions s
      where s.id = quiz_result_stats.session_id
        and s.user_id = auth.uid()
    )
  )
  with check (
    public.is_admin_jwt()
    or exists (
      select 1
      from public.quiz_sessions s
      where s.id = quiz_result_stats.session_id
        and s.user_id = auth.uid()
    )
  );

-- rate_limits: authenticated users can only see/write their own rows; admins can manage all.
drop policy if exists rate_limits_select_all on public.rate_limits;
drop policy if exists rate_limits_insert_all on public.rate_limits;
drop policy if exists rate_limits_update_all on public.rate_limits;
drop policy if exists rate_limits_select_own on public.rate_limits;
drop policy if exists rate_limits_insert_own on public.rate_limits;
drop policy if exists rate_limits_update_own on public.rate_limits;

create policy rate_limits_select_own
  on public.rate_limits
  for select
  to authenticated
  using (
    public.is_admin_jwt()
    or user_id = auth.uid()::text
  );

create policy rate_limits_insert_own
  on public.rate_limits
  for insert
  to authenticated
  with check (
    public.is_admin_jwt()
    or user_id = auth.uid()::text
  );

create policy rate_limits_update_own
  on public.rate_limits
  for update
  to authenticated
  using (
    public.is_admin_jwt()
    or user_id = auth.uid()::text
  )
  with check (
    public.is_admin_jwt()
    or user_id = auth.uid()::text
  );

commit;
