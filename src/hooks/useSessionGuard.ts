'use client';

import {
  useEffect,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

type GuardMode = 'protected' | 'guest';

export default function useSessionGuard<T = any>({
  mode,
  redirectTo,
}: {
  mode: GuardMode;
  redirectTo: string;
}) {
  const router = useRouter();
  const [user, setUser] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ Prevent SSR issues
    if (typeof window === 'undefined') return;

    const token = sessionStorage.getItem('token'); // ✅ correct key
    const userData = sessionStorage.getItem('user');

    const isLoggedIn = Boolean(token && userData);

    /* =========================
       🔐 PROTECTED ROUTES
    ========================= */
    if (mode === 'protected' && !isLoggedIn) {
      router.replace(redirectTo);
      return;
    }

    /* =========================
       👤 GUEST ROUTES
    ========================= */
    if (mode === 'guest' && isLoggedIn) {
      router.replace(redirectTo);
      return;
    }

    /* =========================
       👤 SET USER STATE
    ========================= */
    if (isLoggedIn && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        sessionStorage.clear();
        router.replace(redirectTo);
        return;
      }
    }

    setLoading(false);
  }, [mode, redirectTo, router]);

  return { user, loading };
}
