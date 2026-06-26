import { supabase } from './supabase';

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getAuthToken(): Promise<string | null> {
  const session = await getSession();
  return session?.access_token ?? null;
}

export async function signOut() {
  await supabase.auth.signOut();
}
