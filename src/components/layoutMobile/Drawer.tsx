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
import { useRouter } from 'next/navigation';

import AlertModal from '@/components/modal/AlertModal';
import api from '@/lib/api';

export default function Drawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

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
      {/* Alert Modal */}
      <AlertModal
        {...alert}
        onClose={() =>
          setAlert(prev => ({ ...prev, open: false }))
        }
      />

      <div className="fixed inset-0 z-50 flex">
        {/* Backdrop */}
        <div
          className="flex-1 bg-black/40"
          onClick={onClose}
        />

        {/* Drawer */}
        <div className="w-64 bg-white p-4 flex flex-col animate-slideIn">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-semibold">Menu</h2>
            <button onClick={onClose}>
              <X />
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-3 flex-1">
            <DrawerLink href="/" icon={Home} label="Home" onClick={onClose} />
            <DrawerLink
              href="/user/announcements"
              icon={Bell}
              label="Announcements"
              onClick={onClose}
            />
            <DrawerLink
              href="/user/children"
              icon={Baby}
              label="Children"
              onClick={onClose}
            />
            <DrawerLink
              href="/user/profile"
              icon={User}
              label="Profile"
              onClick={onClose}
            />
          </nav>

          {/* Logout */}
          <div className="pt-4 border-t">
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
              className="w-full flex items-center gap-3 px-3 py-2
                         rounded-lg text-red-600 hover:bg-red-50 transition"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ================= LINK ================= */
function DrawerLink({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: string;
  icon: any;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2
                 rounded-lg hover:bg-slate-100 transition"
    >
      <Icon className="w-5 h-5 text-slate-600" />
      <span>{label}</span>
    </Link>
  );
}
