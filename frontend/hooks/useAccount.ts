'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getCurrentUser, type AuthUser } from '../lib/auth';
import { getFirebaseAuth, isFirebaseConfigured } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

/**
 * Like `useAuth`, but never redirects. Use for shared chrome (e.g. the nav rail)
 * that renders on both authenticated and public pages.
 */
export function useAccount() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      const current = await getCurrentUser();
      if (cancelled) return;
      setUser(current);
      setLoading(false);
    };

    void refresh();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => void refresh());
    const unsubscribeFirebase = isFirebaseConfigured()
      ? onAuthStateChanged(getFirebaseAuth(), () => void refresh())
      : undefined;

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      unsubscribeFirebase?.();
    };
  }, []);

  return { user, loading };
}
