'use client';

import { useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import AlertModal from '@/components/modal/AlertModal';
import useSessionGuard from '@/hooks/useSessionGuard';

type AlertState = {
  open: boolean;
  type: 'success' | 'error';
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function LoginPage() {
  const router = useRouter();

  const { loading } = useSessionGuard({
    mode: 'guest',
    redirectTo: '/admin/dashboard',
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [alert, setAlert] = useState<AlertState>({
    open: false,
    type: 'error',
    message: '',
  });

  const closeAlert = () =>
    setAlert((prev) => ({ ...prev, open: false }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Checking session…
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/loginUser`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        }
      );

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Login failed');
      }

      sessionStorage.setItem('session_token', result.session_token);
      sessionStorage.setItem('user', JSON.stringify(result.data));

      setAlert({
        open: true,
        type: 'success',
        title: 'Login Successful',
        message: `Welcome back, ${result.data.firstName}!`,
        actionLabel: 'Continue',
        onAction: () => router.replace('/admin/dashboard'),
      });
    } catch (err: any) {
      setAlert({
        open: true,
        type: 'error',
        title: 'Login Failed',
        message: err.message || 'Something went wrong',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AlertModal {...alert} onClose={closeAlert} />

      {/* ================= BACKGROUND ================= */}
      <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-[#e4eaee]">

        {/* Medical / Hex Pattern */}
        <div
          className="absolute inset-0 bg-no-repeat bg-right bg-contain opacity-85"
          style={{
            backgroundImage: "url('/login-bg.png')",
          }}
        />

        {/* Light gradient wash (LESS opaque now) */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-[#eaf2f8]/40 to-[#d6e6f2]/60" />

        {/* ================= LOGIN CARD ================= */}
        <div className="relative z-10 w-full max-w-md bg-white/90 backdrop-blur-md rounded-[32px] shadow-xl px-8 pt-20 pb-10">

          {/* Logo Badge */}
          <div className="absolute -top-14 left-1/2 -translate-x-1/2">
            <div className="w-28 h-28 rounded-full bg-white shadow-lg flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Child Immunization Tracker Logo"
                width={80}
                height={80}
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-lg font-semibold tracking-wide text-gray-900">
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
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="
                w-full rounded-2xl border border-gray-300 px-5 py-4
                focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                outline-none transition text-gray-700
              "
            />

            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="
                w-full rounded-2xl border border-gray-300 px-5 py-4
                focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                outline-none transition text-gray-700
              "
            />

            <button
              type="submit"
              disabled={submitting}
              className="
                w-full rounded-2xl py-4 font-semibold text-white
                bg-gradient-to-r from-[#0B4FB3] to-[#1E7CF2]
                hover:opacity-95 transition
                disabled:opacity-60
              "
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
