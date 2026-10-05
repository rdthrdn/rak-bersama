create extension if not exists pgtap with schema extensions;

begin;

select plan(12);

insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'member-a@example.test', '{}'::jsonb, '{"full_name":"Member A"}'::jsonb, now(), now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'member-b@example.test', '{}'::jsonb, '{"full_name":"Member B"}'::jsonb, now(), now()),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'authenticated', 'authenticated', 'outside@example.test', '{}'::jsonb, '{"full_name":"Outside"}'::jsonb, now(), now())
on conflict (id) do nothing;

insert into public.allowed_emails (email)
values ('member-a@example.test'), ('member-b@example.test')
on conflict (email) do nothing;

insert into public.profiles (id, display_name, initials, role)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Member A', 'MA', 'member'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Member B', 'MB', 'member'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Outside', 'O', 'member')
on conflict (id) do nothing;

insert into public.books (id, owner_id, title, author, language, status, format, file_path, cover_path)
values (
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Buku privat A', 'Penulis A', 'id', 'reading', 'pdf',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/dddddddd-dddd-4ddd-8ddd-dddddddddddd/book.pdf',
  null
)
on conflict (id) do nothing;

insert into public.reading_progress (user_id, book_id, locator, percent)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', '{"format":"pdf","page":8,"totalPages":20}', 40)
on conflict (user_id, book_id) do nothing;

insert into public.reviews (id, book_id, author_id, body)
values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Catatan untuk anggota.')
on conflict (id) do nothing;

insert into storage.objects (bucket_id, name)
values ('books', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/dddddddd-dddd-4ddd-8ddd-dddddddddddd/book.pdf')
on conflict do nothing;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated","email":"member-b@example.test"}', true);

select is((select count(*)::integer from public.books where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'), 1, 'member B can see member A book metadata');
select is((select count(*)::integer from storage.objects where bucket_id = 'books' and name like 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/%'), 0, 'member B cannot read member A book object');
select is((select count(*)::integer from public.reading_progress where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), 0, 'member B cannot read member A progress');
select is((select count(*)::integer from public.reviews where book_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'), 1, 'member B can read book reviews');

update public.books set title = 'Buku diambil alih' where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
select is((select title from public.books where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'), 'Buku privat A', 'member B cannot edit member A book');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","role":"authenticated","email":"outside@example.test"}', true);

select is((select public.is_member()), false, 'non-allowlisted account is not a member');
select is((select count(*)::integer from public.books), 0, 'non-member cannot read book metadata');
select is((select count(*)::integer from public.profiles), 0, 'non-member cannot read profiles');
select is((select count(*)::integer from public.allowed_emails), 0, 'non-member cannot read the allowlist');
select is((select count(*)::integer from public.reading_progress), 0, 'non-member cannot read progress');
select is((select count(*)::integer from public.reviews), 0, 'non-member cannot read reviews');
select is((select count(*)::integer from storage.objects), 0, 'non-member cannot read storage objects');

select * from finish();
rollback;
