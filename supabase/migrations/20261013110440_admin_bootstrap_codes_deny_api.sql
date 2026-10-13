create policy admin_bootstrap_codes_deny_api on public.admin_bootstrap_codes
  for all to anon, authenticated
  using (false)
  with check (false);
