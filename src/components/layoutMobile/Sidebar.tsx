'use client';

import { useState } from 'react';

import {
  Baby,
  Bell,
  BellRing,
  Home,
  LogOut,
  User,
} from 'lucide-react';
import Link from 'next/link';
import {
  usePathname,
  useRouter,
} from 'next/navigation';

import AlertModal from '@/components/modal/AlertModal';
import useUnreadNotifications from '@/hooks/useUnreadNotifications';
import api from '@/lib/api';

/* ================= NAV LINKS ================= */

const links = [
  { href: '/user/dashboard', label: 'Home', icon: Home },
  { href: '/user/announcements', label: 'Announcements', icon: Bell },
  { href: '/user/notifications', label: 'Notifications', icon: BellRing },
  { href: '/user/children', label: 'Children', icon: Baby },
  { href: '/user/profile', label: 'Profile', icon: User },
];

/* ================= COMPONENT ================= */

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const unreadCount = useUnreadNotifications();

  const [alert, setAlert] = useState({
    open: false,
    type: 'warning' as 'success' | 'error' | 'warning',
    title: '',
    message: '',
    actionLabel: '',
    onAction: undefined as (() => void) | undefined,
  });

  /* ================= LOGOUT ================= */

  const logout = async () => {
    try {
      const res = await api.post('/auth/logoutUser');

      sessionStorage.clear();

      setAlert({
        open: true,
        type: 'success',
        title: 'Logged Out',
        message: res.data?.message || 'Logout successful',
        actionLabel: 'OK',
        onAction: () => router.replace('/login'),
      });
    } catch (error: any) {
      setAlert({
        open: true,
        type: 'error',
        title: 'Logout Failed',
        message:
          error?.response?.data?.message ||
          'Logout failed. Please try again.',
        actionLabel: '',
        onAction: undefined,
      });
    }
  };

  return (
    <>
      {/* ================= ALERT ================= */}
      <AlertModal
        {...alert}
        onClose={() =>
          setAlert(prev => ({ ...prev, open: false }))
        }
      />

      {/* ================= SIDEBAR ================= */}
      <aside className="flex h-screen w-64 flex-col overflow-y-auto bg-white shadow-sm ring-1 ring-black/5">
        {/* Brand */}
        <div className="px-5 py-6">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            Health Center
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Parent Portal
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
          {links.map(l => {
            const active = pathname === l.href;

            return (
              <Link
                key={l.href}
                href={l.href}
                className={`
                  group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition
                  ${
                    active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }
                `}
              >
                <l.icon
                  className={`h-5 w-5 transition
                    ${
                      active
                        ? 'text-blue-600'
                        : 'text-slate-500 group-hover:text-slate-700'
                    }
                  `}
                />
                {l.label}

                {l.href === '/user/notifications' && unreadCount > 0 ? (
                  <span className="ml-auto rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-semibold text-slate-900">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                ) : null}

                {/* Active Indicator */}
                {active && l.href !== '/user/notifications' && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-blue-500" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4">
          <button
            onClick={() =>
              setAlert({
                open: true,
                type: 'warning',
                title: 'Logout',
                message: 'Are you sure you want to logout?',
                actionLabel: 'Logout',
                onAction: logout,
              })
            }
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
