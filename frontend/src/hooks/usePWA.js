import { useState, useEffect } from 'react';

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    if (isStandalone) {
      setIsInstalled(true);
    }

    // 2. Handle install eligibility event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);

      // Check if user dismissed it recently (within the last 3 days)
      const lastDismissed = localStorage.getItem('pwa-prompt-dismissed-at');
      const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
      
      if (!lastDismissed || Date.now() - parseInt(lastDismissed, 10) > threeDaysInMs) {
        setIsInstallable(true);
      }
    };

    // 3. Handle success installation event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShowSuccess(true);

      // Reset success message after 6 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 6000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return false;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the PWA install prompt');
      setIsInstallable(false);
      setDeferredPrompt(null);
      return true;
    } else {
      console.log('User dismissed the PWA install prompt');
      // Set dismissal timestamp so we don't nag the user
      localStorage.setItem('pwa-prompt-dismissed-at', Date.now().toString());
      setIsInstallable(false);
      return false;
    }
  };

  const dismissPrompt = () => {
    localStorage.setItem('pwa-prompt-dismissed-at', Date.now().toString());
    setIsInstallable(false);
  };

  return {
    isInstallable,
    isInstalled,
    showSuccess,
    installApp,
    dismissPrompt,
    setShowSuccess
  };
}
