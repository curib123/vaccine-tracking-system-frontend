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
    const token = sessionStorage.getItem('session_token');
    const userData = sessionStorage.getItem('user');

    const isLoggedIn = !!token && !!userData;

    // 🔐 Protected pages (dashboard/admin)
    if (mode === 'protected' && !isLoggedIn) {
      router.replace(redirectTo);
      return;
    }

    // 👤 Guest-only pages (login)
    if (mode === 'guest' && isLoggedIn) {
      router.replace(redirectTo);
      return;
    }

    if (isLoggedIn) {
      try {
        setUser(JSON.parse(userData!));
      } catch {
        sessionStorage.clear();
        router.replace(redirectTo);
      }
    }

    setLoading(false);
  }, [mode, redirectTo, router]);

  return { user, loading };
}
