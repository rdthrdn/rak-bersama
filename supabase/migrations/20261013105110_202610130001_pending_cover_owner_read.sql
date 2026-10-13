drop policy if exists "members read book covers" on storage.objects;

create policy "members read book covers" on storage.objects
  for select to authenticated using (
    public.is_member() and bucket_id = 'covers'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.books book
        where book.cover_path = storage.objects.name
      )
    )
  );
