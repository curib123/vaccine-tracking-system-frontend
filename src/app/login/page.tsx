'use client';

import { useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import GuestGuard from '@/components/guards/GuestGuard';
import AlertModal from '@/components/modal/AlertModal';
import api from '@/lib/api';

/* ================= TYPES ================= */
type AlertState = {
  open: boolean;
  type: 'success' | 'error';
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

/* ================= CONTENT ================= */
function LoginContent() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [alert, setAlert] = useState<AlertState>({
    open: false,
    type: 'error',
    message: '',
  });

  const closeAlert = () =>
    setAlert(prev => ({ ...prev, open: false }));

  /* ================= LOGIN HANDLER ================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);

    try {
      const { data } = await api.post('/auth/loginUser', {
        email: email.trim(),
        password: password.trim(),
      });

      if (!data?.success || !data?.token) {
        throw new Error(data?.message || 'Login failed');
      }

      /* ================= STORE SESSION ================= */
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(data.data));
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.data));

      /* ================= ROLE-BASED REDIRECT ================= */
      const roleName = String(data.data.roleName || '')
        .trim()
        .toUpperCase();

      const PARENT_ROLE = String(
        process.env.NEXT_PUBLIC_PARENT_ROLE_NAME  || 'PARENT/GUARDIAN'
      )
        .trim()
        .toUpperCase();

      const redirectTo =
        roleName === PARENT_ROLE
          ? '/user/dashboard'
          : '/admin/dashboard';

      setAlert({
        open: true,
        type: 'success',
        title: 'Login Successful',
        message: `Welcome back, ${data.data.firstName}!`,
        actionLabel: 'Continue',
        onAction: () => router.replace(redirectTo),
      });

    } catch (err: any) {
      setAlert({
        open: true,
        type: 'error',
        title: 'Login Failed',
        message:
          err?.response?.data?.message ||
          err?.message ||
          'Invalid email or password',
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= UI ================= */
  return (
    <>
      <AlertModal {...alert} onClose={closeAlert} />

      <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-[#e4eaee]">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-no-repeat bg-right bg-contain opacity-85"
          style={{ backgroundImage: "url('/login-bg.png')" }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-[#eaf2f8] to-[#d6e6f2]" />

        {/* Card */}
        <div className="relative z-10 w-full max-w-md rounded-[32px] bg-white px-8 pt-20 pb-10 shadow-xl">

          {/* Logo */}
          <div className="absolute -top-14 left-1/2 -translate-x-1/2">
            <div className="w-28 h-28 rounded-full bg-white shadow-lg flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Child Immunization Tracker Logo"
                width={80}
                height={80}
                priority
              />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-lg font-semibold text-gray-900">
              CHILD IMMUNIZATION TRACKER
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              “Keeping immunizations simple and secure”
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email Address"
              className="w-full rounded-2xl border border-gray-200 px-5 py-4
                         focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />

            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-2xl border border-gray-200 px-5 py-4
                         focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl py-4 font-semibold text-white
                         bg-gradient-to-r from-[#0B4FB3] to-[#1E7CF2]
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} Child Immunization Tracker System
          </div>
        </div>
      </div>
    </>
  );
}

/* ================= EXPORT ================= */
export default function LoginPage() {
  return (
    <GuestGuard>
      <LoginContent />
    </GuestGuard>
  );
}
