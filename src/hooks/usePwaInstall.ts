'use client';

import {
  useEffect,
  useState,
} from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
};

function isStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export default function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updateInstalledState = () => {
      setIsInstalled(isStandaloneMode());
    };

    updateInstalledState();
    setShowIosHint(
      /iphone|ipad|ipod/i.test(window.navigator.userAgent)
    );

    const mediaQuery = window.matchMedia('(display-mode: standalone)');

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      updateInstalledState();
    };

    const handleInstalled = () => {
      setDeferredPrompt(null);
      updateInstalledState();
    };

    const handleDisplayModeChange = () => {
      updateInstalledState();
    };

    window.addEventListener(
      'beforeinstallprompt',
      handleBeforeInstallPrompt
    );
    window.addEventListener('appinstalled', handleInstalled);
    window.addEventListener('pageshow', handleDisplayModeChange);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleDisplayModeChange);
    } else {
      mediaQuery.addListener(handleDisplayModeChange);
    }

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleInstalled);
      window.removeEventListener('pageshow', handleDisplayModeChange);

      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener(
          'change',
          handleDisplayModeChange
        );
      } else {
        mediaQuery.removeListener(handleDisplayModeChange);
      }
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) {
      return false;
    }

    setInstalling(true);

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;

      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstalled(true);
        return true;
      }

      return false;
    } finally {
      setInstalling(false);
    }
  };

  return {
    canInstall: !isInstalled && Boolean(deferredPrompt),
    installApp,
    installing,
    isInstalled,
    showIosHint: !isInstalled && showIosHint,
  };
}
