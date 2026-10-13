create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  initials text not null check (char_length(initials) between 1 and 3),
  role text not null default 'member' check (role in ('member', 'admin'))
);

create table if not exists public.allowed_emails (
  email text primary key check (email = lower(btrim(email))),
  created_at timestamptz not null default now()
);

create or replace function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.allowed_emails allowed
    where allowed.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_member() from public;
grant execute on function public.is_member() to authenticated;

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 240),
  author text not null check (char_length(btrim(author)) between 1 and 200),
  language text not null check (char_length(btrim(language)) between 1 and 80),
  genre text,
  year integer check (year is null or year between 1 and 2200),
  pages integer check (pages is null or pages between 1 and 100000),
  synopsis text,
  status text not null default 'unread' check (status in ('reading', 'finished', 'dropped', 'paused', 'unread')),
  format text not null check (format in ('epub', 'pdf')),
  file_path text not null unique,
  cover_path text,
  created_at timestamptz not null default now(),
  constraint book_file_owner_path check (file_path like owner_id::text || '/%'),
  constraint book_cover_owner_path check (cover_path is null or cover_path like owner_id::text || '/%')
);

create table if not exists public.reading_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  locator jsonb not null default '{}'::jsonb,
  percent numeric(5, 2) not null default 0 check (percent between 0 and 100),
  updated_at timestamptz not null default now(),
  unique (user_id, book_id)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 5000),
  created_at timestamptz not null default now()
);

create index if not exists books_owner_created_idx on public.books (owner_id, created_at desc);
create index if not exists books_title_author_idx on public.books (lower(title), lower(author));
create index if not exists reviews_book_created_idx on public.reviews (book_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.allowed_emails enable row level security;
alter table public.books enable row level security;
alter table public.reading_progress enable row level security;
alter table public.reviews enable row level security;

create policy "members read profiles" on public.profiles
  for select to authenticated using (public.is_member());
create policy "members create own profile" on public.profiles
  for insert to authenticated with check (public.is_member() and id = auth.uid() and role = 'member');
create policy "members update own profile" on public.profiles
  for update to authenticated using (public.is_member() and id = auth.uid())
  with check (public.is_member() and id = auth.uid());
grant select, insert on public.profiles to authenticated;
grant update (display_name, initials) on public.profiles to authenticated;

create policy "admins read allowlist" on public.allowed_emails
  for select to authenticated using (
    public.is_member() and exists (
      select 1 from public.profiles profile
      where profile.id = auth.uid() and profile.role = 'admin'
    )
  );
create policy "admins add allowlist entries" on public.allowed_emails
  for insert to authenticated with check (
    public.is_member() and exists (
      select 1 from public.profiles profile
      where profile.id = auth.uid() and profile.role = 'admin'
    )
  );
create policy "admins remove allowlist entries" on public.allowed_emails
  for delete to authenticated using (
    public.is_member() and exists (
      select 1 from public.profiles profile
      where profile.id = auth.uid() and profile.role = 'admin'
    )
  );
grant select, insert, delete on public.allowed_emails to authenticated;

create policy "members read book metadata" on public.books
  for select to authenticated using (public.is_member());
create policy "members add their books" on public.books
  for insert to authenticated with check (public.is_member() and owner_id = auth.uid());
create policy "owners update their books" on public.books
  for update to authenticated using (public.is_member() and owner_id = auth.uid())
  with check (public.is_member() and owner_id = auth.uid());
create policy "owners delete their books" on public.books
  for delete to authenticated using (public.is_member() and owner_id = auth.uid());
grant select, insert, update, delete on public.books to authenticated;

create policy "members read reviews" on public.reviews
  for select to authenticated using (public.is_member());
create policy "members add own reviews" on public.reviews
  for insert to authenticated with check (public.is_member() and author_id = auth.uid());
create policy "authors update own reviews" on public.reviews
  for update to authenticated using (public.is_member() and author_id = auth.uid())
  with check (public.is_member() and author_id = auth.uid());
create policy "authors delete own reviews" on public.reviews
  for delete to authenticated using (public.is_member() and author_id = auth.uid());
grant select, insert, update, delete on public.reviews to authenticated;

create policy "members read their progress" on public.reading_progress
  for select to authenticated using (public.is_member() and user_id = auth.uid());
create policy "members save their progress" on public.reading_progress
  for insert to authenticated with check (public.is_member() and user_id = auth.uid());
create policy "members update their progress" on public.reading_progress
  for update to authenticated using (public.is_member() and user_id = auth.uid())
  with check (public.is_member() and user_id = auth.uid());
create policy "members delete their progress" on public.reading_progress
  for delete to authenticated using (public.is_member() and user_id = auth.uid());
grant select, insert, update, delete on public.reading_progress to authenticated;

alter table public.books force row level security;
alter table public.profiles force row level security;
alter table public.allowed_emails force row level security;
alter table public.reading_progress force row level security;
alter table public.reviews force row level security;
