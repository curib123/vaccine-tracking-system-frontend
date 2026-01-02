'use client';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import AlertModal from '@/components/modal/AlertModal';
import useSessionGuard from '@/hooks/useSessionGuard';
import api from '@/lib/api';

type Props = {
  children: React.ReactNode;
  redirectTo?: string;
};

export default function ParentAuthGuard({
  children,
  redirectTo = '/login',
}: Props) {
  const router = useRouter();
  const logoutTriggered = useRef(false);

  const { user, loading } = useSessionGuard({
    mode: 'protected',
    redirectTo,
  });

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

  /* ================= DEBUG (DEV ONLY) ================= */
  if (process.env.NODE_ENV === 'development') {
    console.log('[ParentAuthGuard] loading:', loading);
    console.log(
      '[ParentAuthGuard] parentRole(env):',
      parentRole || '(empty)'
    );
    console.log('[ParentAuthGuard] user:', user);
    console.log(
      '[ParentAuthGuard] logoutTriggered:',
      logoutTriggered.current
    );
  }

  /* ================= LOGOUT ================= */
  const logout = async (reason: string) => {
    if (logoutTriggered.current) {
      if (process.env.NODE_ENV === 'development') {
        console.log(
          '[ParentAuthGuard] Logout already triggered, skipping'
        );
      }
      return;
    }

    logoutTriggered.current = true;

    if (process.env.NODE_ENV === 'development') {
      console.warn('[ParentAuthGuard] Logging out:', reason);
    }

    try {
      await api.post('/auth/logoutUser');
      if (process.env.NODE_ENV === 'development') {
        console.log('[ParentAuthGuard] Logout API success');
      }
    } catch (err) {
      console.error(
        '[ParentAuthGuard] Logout API failed',
        err
      );
    } finally {
      sessionStorage.clear();

      if (process.env.NODE_ENV === 'development') {
        console.log(
          '[ParentAuthGuard] Session cleared, showing alert'
        );
      }

      setAlert({
        open: true,
        type: 'warning',
        title: 'Access Restricted',
        message: reason,
      });
    }
  };

  useEffect(() => {
    if (loading) {
      if (process.env.NODE_ENV === 'development') {
        console.log(
          '[ParentAuthGuard] Waiting for session to load...'
        );
      }
      return;
    }

    if (!user) {
      console.warn(
        '[ParentAuthGuard] No user found → redirect login'
      );
      router.replace(redirectTo);
      return;
    }

    if (!parentRole) {
      console.error(
        '[ParentAuthGuard] parentRole missing from env'
      );
      logout(
        'System role configuration error. You have been logged out.'
      );
      return;
    }

    const userRole =
      user.roleName?.trim().toUpperCase() ?? '';

    if (process.env.NODE_ENV === 'development') {
      console.log('[ParentAuthGuard] userRole:', userRole);
      console.log(
        '[ParentAuthGuard] expected parentRole:',
        parentRole
      );
    }

    // ❌ NOT PARENT → AUTO LOGOUT
    if (userRole !== parentRole) {
      console.warn(
        '[ParentAuthGuard] Role mismatch → auto logout'
      );
      logout(
        'You are not authorized to access this page. Your session has been logged out.'
      );
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log(
          '[ParentAuthGuard] Parent role confirmed → access granted ✅'
        );
      }
    }
  }, [user, loading, parentRole, router, redirectTo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Checking session…
      </div>
    );
  }

  if (alert.open) {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        '[ParentAuthGuard] Showing AlertModal'
      );
    }

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

  // ✅ PARENT → ALLOWED
  if (process.env.NODE_ENV === 'development') {
    console.log('[ParentAuthGuard] Rendering children');
  }

  return <>{children}</>;
}
