create or replace function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.allowed_emails allowed
      where allowed.email = lower(coalesce(auth.jwt() ->> 'email', ''))
    );
$$;

revoke all on function public.is_member() from public;
revoke all on function public.is_member() from anon;
grant execute on function public.is_member() to authenticated;
