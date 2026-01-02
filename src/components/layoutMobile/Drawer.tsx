'use client';

import { useState } from 'react';

import {
  Baby,
  Bell,
  Home,
  LogOut,
  User,
  X,
} from 'lucide-react';
import Link from 'next/link';
import {
  usePathname,
  useRouter,
} from 'next/navigation';

import AlertModal from '@/components/modal/AlertModal';
import api from '@/lib/api';

/* ================= COMPONENT ================= */

export default function Drawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [alert, setAlert] = useState({
    open: false,
    type: 'warning' as 'success' | 'error' | 'warning',
    title: '',
    message: '',
    actionLabel: '',
    onAction: undefined as (() => void) | undefined,
  });

  if (!open) return null;

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

      {/* ================= BACKDROP + DRAWER ================= */}
      <div className="fixed inset-0 z-50 flex">
        {/* Backdrop */}
        <div
          className="flex-1 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Drawer Panel */}
        <aside className="relative w-72 max-w-[85%] animate-slideIn rounded-l-3xl bg-white shadow-xl ring-1 ring-black/5">
          <div className="flex h-full flex-col px-4 pb-4">
            {/* ===== HEADER ===== */}
            <div className="flex items-center justify-between px-2 py-5">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                  Health Center
                </h2>
                <p className="text-xs text-slate-500">
                  Parent Portal
                </p>
              </div>

              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-slate-100 transition"
                aria-label="Close menu"
              >
                <X className="h-5 w-5 text-slate-700" />
              </button>
            </div>

            {/* ===== NAVIGATION ===== */}
            <nav className="flex-1 space-y-1 px-1">
              <DrawerLink
                href="/user/dashboard"
                icon={Home}
                label="Home"
                active={pathname === '/user/dashboard'}
                onClick={onClose}
              />
              <DrawerLink
                href="/user/announcements"
                icon={Bell}
                label="Announcements"
                active={pathname === '/user/announcements'}
                onClick={onClose}
              />
              <DrawerLink
                href="/user/children"
                icon={Baby}
                label="Children"
                active={pathname === '/user/children'}
                onClick={onClose}
              />
              <DrawerLink
                href="/user/profile"
                icon={User}
                label="Profile"
                active={pathname === '/user/profile'}
                onClick={onClose}
              />
            </nav>

            {/* ===== LOGOUT ===== */}
            <div className="pt-4">
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
          </div>
        </aside>
      </div>
    </>
  );
}

/* ================= DRAWER LINK ================= */

function DrawerLink({
  href,
  icon: Icon,
  label,
  active,
  onClick,
}: {
  href: string;
  icon: any;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition
        ${
          active
            ? 'bg-blue-50 text-blue-700'
            : 'text-slate-600 hover:bg-slate-100'
        }
      `}
    >
      <Icon
        className={`h-5 w-5 transition
          ${
            active
              ? 'text-blue-600'
              : 'text-slate-500 group-hover:text-slate-700'
          }
        `}
      />
      {label}

      {active && (
        <span className="ml-auto h-2 w-2 rounded-full bg-blue-500" />
      )}
    </Link>
  );
}
