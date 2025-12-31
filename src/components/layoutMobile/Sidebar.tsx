'use client';

import { useState } from 'react';

import {
  Baby,
  Bell,
  Home,
  LogOut,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import AlertModal from '@/components/modal/AlertModal';
import api from '@/lib/api';

const links = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/user/announcements', label: 'Announcements', icon: Bell },
  { href: '/user/children', label: 'Children', icon: Baby },
  { href: '/user/profile', label: 'Profile', icon: User },
];

export default function Sidebar() {
  const router = useRouter();

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
      {/* Alert Modal */}
      <AlertModal
        {...alert}
        onClose={() =>
          setAlert(prev => ({ ...prev, open: false }))
        }
      />

      <div className="h-full bg-white border-r p-4 flex flex-col">
        <h2 className="text-lg font-semibold mb-6">
          Health Center
        </h2>

        {/* Navigation */}
        <nav className="space-y-2 flex-1">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="flex items-center gap-3 px-3 py-2
                         rounded-lg hover:bg-slate-100 transition"
            >
              <l.icon className="w-5 h-5 text-slate-600" />
              {l.label}
            </Link>
          ))}
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
    </>
  );
}
