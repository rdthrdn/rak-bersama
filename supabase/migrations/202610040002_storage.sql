insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('books', 'books', false, 52428800, array['application/epub+zip', 'application/pdf']),
  ('covers', 'covers', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "owners read their book files" on storage.objects
  for select to authenticated using (
    public.is_member() and bucket_id = 'books'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "owners add book files" on storage.objects
  for insert to authenticated with check (
    public.is_member() and bucket_id = 'books'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "owners remove book files" on storage.objects
  for delete to authenticated using (
    public.is_member() and bucket_id = 'books'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "members read book covers" on storage.objects
  for select to authenticated using (
    public.is_member() and bucket_id = 'covers'
    and exists (
      select 1 from public.books book
      where book.cover_path = storage.objects.name
    )
  );
create policy "owners add book covers" on storage.objects
  for insert to authenticated with check (
    public.is_member() and bucket_id = 'covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "owners remove book covers" on storage.objects
  for delete to authenticated using (
    public.is_member() and bucket_id = 'covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
