create table public.admin_bootstrap_codes (
  id boolean primary key default true check (id),
  token_hash text not null check (token_hash ~ '^[0-9a-f]{64}$'),
  consumed_at timestamptz
);

alter table public.admin_bootstrap_codes enable row level security;
revoke all on table public.admin_bootstrap_codes from public, anon, authenticated;
grant select, update on table public.admin_bootstrap_codes to service_role;
