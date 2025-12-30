'use client';

import { useEffect } from 'react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertModalProps {
  open: boolean;
  type?: AlertType;
  title?: string;
  message: string;
  onClose: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

/* ================= THEME ================= */
const themeMap: Record<
  AlertType,
  {
    icon: string;
    bg: string;
    text: string;
    button: string;
    buttonHover: string;
  }
> = {
  success: {
    icon: '✓',
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    button: 'bg-emerald-600',
    buttonHover: 'hover:bg-emerald-700',
  },
  error: {
    icon: '✕',
    bg: 'bg-rose-100',
    text: 'text-rose-700',
    button: 'bg-rose-600',
    buttonHover: 'hover:bg-rose-700',
  },
  warning: {
    icon: '!',
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    button: 'bg-amber-500',
    buttonHover: 'hover:bg-amber-600',
  },
  info: {
    icon: 'ℹ',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    button: 'bg-blue-600',
    buttonHover: 'hover:bg-blue-700',
  },
};

export default function AlertModal({
  open,
  type = 'info',
  title,
  message,
  onClose,
  actionLabel,
  onAction,
}: AlertModalProps) {
  useEffect(() => {
    if (!open) return;
  }, [open]);

  if (!open) return null;

  const theme = themeMap[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl animate-scaleIn">

        {/* ICON */}
        <div className="flex justify-center -mt-8">
          <div
            className={`
              w-16 h-16 rounded-full
              flex items-center justify-center
              text-3xl font-bold
              shadow-lg
              ${theme.bg} ${theme.text}
            `}
          >
            {theme.icon}
          </div>
        </div>

        {/* CONTENT */}
        <div className="mt-4 px-6 pb-6 text-center">
          <h3 className="text-lg font-semibold text-slate-900">
            {title || 'Notice'}
          </h3>

          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            {message}
          </p>

          {/* ACTIONS */}
          <div className="mt-6 flex gap-3">
            {actionLabel && onAction ? (
              <>
                <button
                  onClick={onClose}
                  className="
                    w-1/2 rounded-xl
                    bg-slate-100 text-slate-700
                    py-2.5 text-sm font-medium
                    hover:bg-slate-200
                    transition
                  "
                >
                  Cancel
                </button>

                <button
                  onClick={() => {
                    onAction();
                    onClose();
                  }}
                  className={`
                    w-1/2 rounded-xl
                    py-2.5 text-sm font-medium
                    text-white
                    transition
                    ${theme.button} ${theme.buttonHover}
                  `}
                >
                  {actionLabel}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className={`
                  w-full rounded-xl
                  py-2.5 text-sm font-medium
                  text-white
                  transition
                  ${theme.button} ${theme.buttonHover}
                `}
              >
                OK
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
