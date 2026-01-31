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
  const [showPassword, setShowPassword] = useState(false);

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

      /* ================= ROLE-BASED REDIRECT ================= */
      const roleName = String(data.data.roleName || '')
        .trim()
        .toUpperCase();

      const PARENT_ROLE = String(
        process.env.NEXT_PUBLIC_PARENT_ROLE_NAME || 'PARENT/GUARDIAN'
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

      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        
        {/* Main Container */}
        <div className="w-full max-w-md">
          
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative w-24 h-24 rounded-full bg-white shadow-2xl flex items-center justify-center ring-4 ring-blue-100">
              <Image
                src="/logo.png"
                alt="Child Immunization Tracker Logo"
                width={64}
                height={64}
                priority
              />
            </div>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-6">
            
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Welcome Back
              </h1>
              <p className="text-sm text-gray-600 font-medium">
                Child Immunization Tracker
              </p>
              <p className="text-xs text-gray-500">
                Keeping immunizations simple and secure
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Email Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 pl-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 pl-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3.5 rounded-xl border-2 border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="pt-4 text-center border-t border-gray-100">
              <p className="text-xs text-gray-500">
                © {new Date().getFullYear()} Child Immunization Tracker System
              </p>
            </div>
          </div>

          {/* Security Badge */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-md text-xs text-gray-600">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Secure & Encrypted</span>
            </div>
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