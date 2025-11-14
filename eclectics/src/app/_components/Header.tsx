"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type User = { id?: string; email: string; name?: string } | null;

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const [notifReady, setNotifReady] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          setUser(null);
        }
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [pathname]);

  async function enableNotifications() {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return;
      const reg = await navigator.serviceWorker.register('/sw.js');
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        setNotifReady(true);
        return;
      }
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as unknown as string;
      const key = vapidPublicKey ? urlBase64ToUint8Array(vapidPublicKey) : undefined;
      const subscription = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      });
      setNotifReady(true);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    (async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        if (sub && Notification.permission === 'granted') setNotifReady(true);
      } catch {}
    })();
  }, []);

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Hide header on login/signup pages
  if (pathname === '/login' || pathname === '/signup') return null;

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      router.push('/login');
    }
  }

  return (
    <header className="w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg text-purple-700">Eclectics</Link>
        <div>
          {loading ? null : user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700 dark:text-gray-300">Hi, {user.name || user.email}</span>
              {!notifReady && (
                <button onClick={enableNotifications} className="text-sm text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-md border border-purple-200 active:scale-95 transition focus:outline-none focus:ring-2 focus:ring-purple-400">Enable Notifications</button>
              )}
              <button onClick={handleLogout} className="text-sm text-red-600 hover:underline">Log out</button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm text-gray-700 hover:underline">Log in</Link>
              <Link href="/signup" className="text-sm text-purple-600 hover:underline">Sign up</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
