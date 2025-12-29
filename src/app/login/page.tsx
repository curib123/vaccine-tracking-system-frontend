'use client';

import { useState } from 'react';

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

  // ✅ GUEST-ONLY GUARD (THIS IS THE FIX)
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

  // ⛔ Wait for guard decision
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

      // ✅ Save session
      sessionStorage.setItem('session_token', result.session_token);
      sessionStorage.setItem('user', JSON.stringify(result.data));

      // ✅ Success modal → continue to admin
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
      {/* 🔔 Alert Modal */}
      <AlertModal
        open={alert.open}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        actionLabel={alert.actionLabel}
        onAction={alert.onAction}
        onClose={closeAlert}
      />

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-100 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-green-100">

          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-xl font-semibold text-green-700 tracking-wide">
              Child Immunization Vaccine Tracker
            </h1>

            <div className="mt-3">
              <h2 className="text-3xl font-bold text-green-600">
                Welcome Back
              </h2>
              <p className="text-gray-500 mt-1">
                Sign in to continue
              </p>
            </div>

            <div className="mt-4 mx-auto w-20 h-1 rounded-full bg-green-200" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@healthcenter.com"
                className="w-full rounded-xl border border-gray-300 px-4 py-3
                  focus:border-green-500 focus:ring-2 focus:ring-green-100
                  outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-300 px-4 py-3
                  focus:border-green-500 focus:ring-2 focus:ring-green-100
                  outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-green-600 hover:bg-green-700
                text-white font-semibold py-3 transition
                disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Health Center System
          </div>
        </div>
      </div>
    </>
  );
}
