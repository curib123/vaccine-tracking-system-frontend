'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  Download,
  Share,
  X,
} from 'lucide-react';

import usePwaInstall from '@/hooks/usePwaInstall';

const DISMISS_KEY = 'parent-pwa-install-dismissed-v1';

export default function ParentPwaInstallPrompt() {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }

    return window.localStorage.getItem(DISMISS_KEY) === 'true';
  });
  const {
    canInstall,
    installApp,
    installing,
    isInstalled,
    showIosHint,
  } = usePwaInstall();

  useEffect(() => {
    if (typeof window !== 'undefined' && isInstalled) {
      window.localStorage.removeItem(DISMISS_KEY);
    }
  }, [isInstalled]);

  const hidePrompt = () => {
    window.localStorage.setItem(DISMISS_KEY, 'true');
    setDismissed(true);
  };

  if (isInstalled || dismissed || (!canInstall && !showIosHint)) {
    return null;
  }

  return (
    <section className="mb-4 md:hidden">
      <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-sky-500 p-[1px] shadow-sm">
        <div className="rounded-[calc(1.5rem-1px)] bg-white/95 p-4 backdrop-blur">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
              {showIosHint ? (
                <Share className="h-5 w-5" />
              ) : (
                <Download className="h-5 w-5" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">
                Install ImmuniTrack
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {showIosHint
                  ? 'Open Share, then tap Add to Home Screen for an app-like parent portal.'
                  : 'Add the parent portal to your home screen for faster access and a full-screen mobile experience.'}
              </p>
            </div>

            <button
              type="button"
              onClick={hidePrompt}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Dismiss install prompt"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {!showIosHint && canInstall ? (
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={installApp}
                disabled={installing}
                className="btn-blue flex-1 disabled:cursor-wait"
              >
                {installing ? 'Preparing...' : 'Install app'}
              </button>

              <button
                type="button"
                onClick={hidePrompt}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Maybe later
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
