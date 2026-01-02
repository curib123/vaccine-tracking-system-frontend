'use client';

import {
  useEffect,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import ParentAuthGuard from '@/components/guards/ParentGuard';
import AlertModal from '@/components/modal/AlertModal';
import api from '@/lib/api';

/* ================= TYPES ================= */
type UserProfile = {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  roleName: string;
  contactNo?: string;
  address?: string;
  createdAt?: string;
};

/* ================= PAGE ================= */
export default function ProfilePage() {
  return (
    <ParentAuthGuard>
      <ProfileContent />
    </ParentAuthGuard>
  );
}

/* ================= CONTENT ================= */
function ProfileContent() {
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [alert, setAlert] = useState({
    open: false,
    type: 'error' as 'error' | 'success' | 'warning',
    title: '',
    message: '',
    actionLabel: '',
    onAction: undefined as (() => void) | undefined,
  });

  /* ================= LOAD SESSION ================= */
  useEffect(() => {
    const raw = sessionStorage.getItem('user');

    if (!raw) {
      setAlert({
        open: true,
        type: 'error',
        title: 'Session Expired',
        message: 'Please login again.',
        actionLabel: '',
        onAction: undefined,
      });

      setTimeout(() => router.replace('/login'), 1500);
      return;
    }

    try {
      setUser(JSON.parse(raw));
    } catch {
      sessionStorage.clear();
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#eef3f8]">
        <span className="text-gray-500 animate-pulse">
          Loading profile…
        </span>
      </div>
    );
  }

  if (!user) return null;

  const fullName =
    `${user.firstName} ${user.middleName || ''} ${user.lastName}`.trim();

  /* ================= UI ================= */
  return (
    <>
      <AlertModal
        {...alert}
        onClose={() =>
          setAlert(prev => ({ ...prev, open: false }))
        }
      />

      <div className="min-h-screen bg-gradient-to-br from-[#eef3f8] via-[#eaf1f7] to-[#e3edf5] px-4 pt-28 pb-10">
        <div className="mx-auto max-w-3xl relative">

          {/* Avatar */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-20">
            <div
              className="w-32 h-32 rounded-full
              bg-gradient-to-br from-[#0B4FB3] to-[#1E7CF2]
              border-[5px] border-white shadow-2xl
              flex items-center justify-center
              text-white text-4xl font-bold"
            >
              {user.firstName.charAt(0)}
            </div>
          </div>

          {/* Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-[36px] shadow-xl pt-24 pb-10 px-6 sm:px-10">

            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
                {fullName}
              </h1>

              <p className="mt-1 text-sm text-gray-500 break-all">
                {user.email}
              </p>

              <div className="mt-4">
                <span className="text-xs px-4 py-1.5 rounded-full
                  bg-blue-50 text-blue-700 font-medium">
                  {user.roleName}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-10 grid grid-cols-3 text-center divide-x">
              <Stat label="Status" value="Active" />
              <Stat
                label="Member Since"
                value={
                  user.createdAt
                    ? new Date(user.createdAt).getFullYear().toString()
                    : '—'
                }
              />
              <Stat label="Account" value="Verified" />
            </div>

            {/* Info */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Info label="Contact Number" value={user.contactNo || '—'} />
              <Info label="Address" value={user.address || '—'} />
            </div>

            {/* Logout */}
            <div className="mt-12 flex justify-center">
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
                className="text-sm font-medium text-red-600 hover:text-red-700 transition"
              >
                Logout
              </button>
            </div>

          </div>

          <div className="mt-8 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} Child Immunization Tracker System
          </div>
        </div>
      </div>
    </>
  );
}

/* ================= SMALL COMPONENTS ================= */
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide">
        {label}
      </p>
      <p className="mt-1 text-sm text-gray-800 break-words">
        {value}
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2">
      <p className="text-lg font-semibold text-gray-900">
        {value}
      </p>
      <p className="text-xs text-gray-400 mt-1">
        {label}
      </p>
    </div>
  );
}
