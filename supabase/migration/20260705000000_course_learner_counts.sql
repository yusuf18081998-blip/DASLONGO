create table if not exists public.course_enrollments (
  course_id text not null check (course_id ~ '^[a-z0-9-]{1,60}$'),
  user_id uuid not null references auth.users (id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  primary key (course_id, user_id)
);

alter table public.course_enrollments enable row level security;
revoke all on table public.course_enrollments from public, anon, authenticated;

create or replace function public.get_course_learner_counts()
returns table (course_id text, learner_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select enrollment.course_id, count(*)::bigint
  from public.course_enrollments as enrollment
  group by enrollment.course_id;
$$;

revoke all on function public.get_course_learner_counts() from public;
grant execute on function public.get_course_learner_counts() to anon, authenticated;

create or replace function public.enroll_in_course(p_course_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign-in is required to enroll in a course';
  end if;

  if p_course_id is null or p_course_id !~ '^[a-z0-9-]{1,60}$' then
    raise exception 'Invalid course ID';
  end if;

  insert into public.course_enrollments (course_id, user_id)
  values (p_course_id, auth.uid())
  on conflict (course_id, user_id) do nothing;
end;
$$;

revoke all on function public.enroll_in_course(text) from public;
grant execute on function public.enroll_in_course(text) to authenticated;

create or replace function public.unenroll_from_course(p_course_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign-in is required to leave a course';
  end if;

  if p_course_id is null or p_course_id !~ '^[a-z0-9-]{1,60}$' then
    raise exception 'Invalid course ID';
  end if;

  delete from public.course_enrollments
  where course_id = p_course_id
    and user_id = auth.uid();
end;
$$;

revoke all on function public.unenroll_from_course(text) from public;
grant execute on function public.unenroll_from_course(text) to authenticated;
