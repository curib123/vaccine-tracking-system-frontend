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

const theme = {
  success: { icon: '✓', color: 'green' },
  error: { icon: '✕', color: 'red' },
  warning: { icon: '!', color: 'yellow' },
  info: { icon: 'ℹ', color: 'blue' },
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

  const t = theme[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl animate-scaleIn">

        {/* Icon */}
        <div className="flex justify-center -mt-8">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center
            bg-${t.color}-100 text-${t.color}-700 text-3xl font-bold shadow-md`}
          >
            {t.icon}
          </div>
        </div>

        {/* Content */}
        <div className="mt-4 px-6 pb-6 text-center">
          <h3 className="text-lg font-semibold text-gray-800">
            {title || type.toUpperCase()}
          </h3>

          <p className="mt-2 text-sm text-gray-600">
            {message}
          </p>

          <div className="mt-6 flex gap-3">
            {actionLabel && onAction ? (
              <>
                <button
                  onClick={onClose}
                  className="w-1/2 rounded-xl border border-gray-300 text-gray-600 py-2.5 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onAction();
                    onClose();
                  }}
                  className={`w-1/2 rounded-xl bg-${t.color}-600 text-white py-2.5 text-sm`}
                >
                  {actionLabel}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="w-full rounded-xl bg-green-600 text-white py-2.5 text-sm"
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
