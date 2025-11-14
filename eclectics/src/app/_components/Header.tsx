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
