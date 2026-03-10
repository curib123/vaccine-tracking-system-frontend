'use client';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import AlertModal from '@/components/modal/AlertModal';
import { ScreenShellSkeleton } from '@/components/ui/Shimmer';
import useSessionGuard from '@/hooks/useSessionGuard';
import api from '@/lib/api';

type Props = {
  children: React.ReactNode;
  redirectTo?: string;
};

export default function AuthGuard({
  children,
  redirectTo = '/login',
}: Props) {
  const router = useRouter();
  const logoutTriggered = useRef(false);

  const { user, loading } = useSessionGuard({
    mode: 'protected',
    redirectTo,
  });

  /**
   * ✅ SAFE ENV RESOLUTION (UPPERCASE)
   */
  const parentRole = (
    process.env.NEXT_PUBLIC_PARENT_ROLE_NAME ??
    process.env.PARENT_ROLE_NAME ??
    ''
  )
    .trim()
    .toUpperCase();

  const [alert, setAlert] = useState({
    open: false,
    type: 'warning' as 'warning' | 'error' | 'success',
    title: '',
    message: '',
  });

  /* ================= LOGOUT ================= */
  const logout = async (reason: string) => {
    if (logoutTriggered.current) return;
    logoutTriggered.current = true;

    try {
      await api.post('/auth/logoutUser');
    } catch (err) {
      console.error('[AuthGuard] Logout API failed', err);
    } finally {
      sessionStorage.clear();

      setAlert({
        open: true,
        type: 'warning',
        title: 'Access Restricted',
        message: reason,
      });
    }
  };

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace(redirectTo);
      return;
    }

    if (!parentRole) {
      logout(
        'System role configuration error. You have been logged out.'
      );
      return;
    }

    const userRole =
      user.roleName?.trim().toUpperCase() ?? '';

    // ❌ BLOCK ONLY Parent / Guardian
    if (userRole === parentRole) {
      logout(
        'Parent or Guardian accounts are not allowed to access this page. You have been logged out.'
      );
    }
  }, [user, loading, parentRole, router, redirectTo]);

  if (loading) {
    return <ScreenShellSkeleton />;
  }

  if (alert.open) {
    return (
      <AlertModal
        open
        type={alert.type}
        title={alert.title}
        message={alert.message}
        actionLabel="OK"
        onAction={() => router.replace('/login')}
        onClose={() => router.replace('/login')}
        
      />
    );
  }

  // ✅ ALL OTHER ROLES → OPEN PAGE
  return <>{children}</>;
}
