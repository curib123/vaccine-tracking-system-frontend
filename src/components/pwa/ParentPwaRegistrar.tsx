'use client';

import { useEffect } from 'react';

export default function ParentPwaRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    if (!('serviceWorker' in navigator)) {
      return;
    }

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .catch(error => {
        console.error(
          '[ParentPwaRegistrar] Service worker registration failed.',
          error
        );
      });
  }, []);

  return null;
}
