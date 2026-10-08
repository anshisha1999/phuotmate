import { useEffect, useState } from 'react';

// Sự kiện Chrome/Edge bắn ra khi app đủ điều kiện cài đặt (chưa có trong lib.dom)
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Trả về hàm mở hộp thoại "Cài đặt app" của trình duyệt, hoặc null khi không cài được
 * (đã cài rồi, đang chạy trong app, hoặc trình duyệt không hỗ trợ - vd Safari iOS).
 */
export function usePwaInstall(): (() => Promise<void>) | null {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferredPrompt(null);

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!deferredPrompt) return null;

  return async () => {
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null); // mỗi sự kiện chỉ dùng được 1 lần
  };
}
