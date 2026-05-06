'use client';

import { useState } from 'react';

import {
  Download,
  Share,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import GuestGuard from '@/components/guards/GuestGuard';
import AlertModal from '@/components/modal/AlertModal';
import usePwaInstall from '@/hooks/usePwaInstall';
import api from '@/lib/api';

type AlertState = {
  open: boolean;
  type: 'success' | 'error';
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

function LoginContent() {
  const router = useRouter();
  const {
    canInstall,
    installApp,
    installing,
    isInstalled,
    showIosHint,
  } = usePwaInstall();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [alert, setAlert] = useState<AlertState>({
    open: false,
    type: 'error',
    message: '',
  });

  const closeAlert = () =>
    setAlert(prev => ({ ...prev, open: false }));

  const installAvailable = canInstall || showIosHint;

  const handleInstallClick = async () => {
    if (showIosHint) {
      setShowInstallHelp(prev => !prev);
      return;
    }

    await installApp();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitting(true);

    try {
      const { data } = await api.post('/auth/loginUser', {
        email: email.trim(),
        password: password.trim(),
      });

      if (!data?.success || !data?.token) {
        throw new Error(data?.message || 'Login failed');
      }

      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(data.data));
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.data));

      const roleName = String(data.data.roleName || '')
        .trim()
        .toUpperCase();

      const parentRole = String(
        process.env.NEXT_PUBLIC_PARENT_ROLE_NAME || 'PARENT/GUARDIAN'
      )
        .trim()
        .toUpperCase();

      const redirectTo =
        roleName === parentRole
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
    } catch (error: unknown) {
      const responseMessage =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof error.response === 'object' &&
        error.response !== null &&
        'data' in error.response &&
        typeof error.response.data === 'object' &&
        error.response.data !== null &&
        'message' in error.response.data &&
        typeof error.response.data.message === 'string'
          ? error.response.data.message
          : null;

      const fallbackMessage =
        error instanceof Error
          ? error.message
          : 'Invalid email or password';

      setAlert({
        open: true,
        type: 'error',
        title: 'Login Failed',
        message: responseMessage || fallbackMessage,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AlertModal {...alert} onClose={closeAlert} />

      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#e4eaee] px-4">
        <div
          className="absolute inset-0 bg-right bg-no-repeat bg-contain opacity-85"
          style={{ backgroundImage: "url('/login-bg.png')" }}
        />

        <div className="absolute inset-0 bg-gradient-to-br from-white via-[#eaf2f8] to-[#d6e6f2]" />

        <div className="relative z-10 w-full max-w-md rounded-[32px] bg-white px-8 pb-10 pt-20 shadow-xl">
          <div className="absolute -top-14 left-1/2 -translate-x-1/2">
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white shadow-lg">
              <Image
                src="/logo.png"
                alt="Child Immunization Tracker Logo"
                width={80}
                height={80}
                priority
              />
            </div>
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-lg font-semibold text-gray-900">
              CHILD IMMUNIZATION TRACKER
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Keeping immunizations simple and secure
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email Address"
              className="w-full rounded-2xl border border-gray-200 px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-2xl border border-gray-200 px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-gradient-to-r from-[#0B4FB3] to-[#1E7CF2] py-4 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>

            {!isInstalled && installAvailable ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  disabled={installing}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 py-4 font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-wait disabled:opacity-70"
                >
                  {showIosHint ? (
                    <Share className="h-4 w-4" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {showIosHint
                    ? 'Install on iPhone or iPad'
                    : installing
                      ? 'Preparing install...'
                      : 'Install App'}
                </button>

                <p className="text-center text-xs leading-5 text-slate-500">
                  {showIosHint && showInstallHelp
                    ? 'In Safari, tap Share and choose Add to Home Screen.'
                    : 'Install ImmuniTrack for faster access from your home screen.'}
                </p>
              </div>
            ) : null}
          </form>

          <div className="mt-8 text-center text-xs text-gray-500">
            (c) {new Date().getFullYear()} Child Immunization Tracker System
          </div>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <GuestGuard>
      <LoginContent />
    </GuestGuard>
  );
}
