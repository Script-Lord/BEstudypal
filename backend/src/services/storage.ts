import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function downloadFromStorage(storagePath: string): Promise<Buffer> {
  const supabase = getSupabase();
  const { data, error } = await supabase.storage
    .from('documents')
    .download(storagePath);

  if (error || !data) throw new Error(`Storage download failed: ${error?.message}`);

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function uploadTextToStorage(
  storagePath: string,
  content: string,
  contentType = 'text/markdown'
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.storage
    .from('documents')
    .upload(storagePath, Buffer.from(content, 'utf8'), {
      contentType,
      upsert: false,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);
}

export async function deleteFromStorage(storagePath: string): Promise<void> {
  const supabase = getSupabase();
  await supabase.storage.from('documents').remove([storagePath]);
}
