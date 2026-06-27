-- Storage setup for document uploads.
--
-- The browser uploads directly to Supabase Storage using the ANON key with no
-- Supabase Auth session (auth is handled by Firebase), so uploads run as the
-- `anon` role. The backend uses the SERVICE ROLE key for download/delete, which
-- bypasses RLS. Therefore only an INSERT (and SELECT) policy for `anon` on the
-- `documents` bucket is required for end-to-end uploads to work.

-- 1. Create the private bucket the app expects.
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- 2. Allow the anon role to upload into the documents bucket.
drop policy if exists "anon upload documents" on storage.objects;
create policy "anon upload documents"
  on storage.objects for insert to anon
  with check (bucket_id = 'documents');

-- 3. Allow the anon role to read objects in the documents bucket.
drop policy if exists "anon read documents" on storage.objects;
create policy "anon read documents"
  on storage.objects for select to anon
  using (bucket_id = 'documents');
