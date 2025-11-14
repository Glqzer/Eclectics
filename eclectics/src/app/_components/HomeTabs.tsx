"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HomeTabs() {
  const [tab, setTab] = useState<'choreographies' | 'schedule'>('choreographies');
  const [email, setEmail] = useState<string | null>(null);
  const [choreographies, setChoreographies] = useState<Array<any>>([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json();
            setEmail(data.email ?? null);
        } else {
          setEmail(null);
        }
      } catch {
        if (mounted) setEmail(null);
      }
    })();
    // fetch choreographies when mounted
    (async () => {
      try {
        const r = await fetch('/api/choreographies', { cache: 'no-store' });
        if (!mounted) return;
        if (r.ok) {
          const list = await r.json();
          setChoreographies(list || []);
        } else {
          setChoreographies([]);
        }
      } catch {
        if (mounted) setChoreographies([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 mb-6">
        <button
          type="button"
          onClick={() => setTab('choreographies')}
          className={`px-4 py-2 rounded-t-md text-sm font-medium transition-colors ${
            tab === 'choreographies'
              ? 'bg-white dark:bg-zinc-900 border-x border-t border-gray-200 dark:border-gray-800 text-purple-700 dark:text-purple-300'
              : 'text-gray-600 dark:text-gray-300 hover:text-purple-700 hover:bg-gray-100 dark:hover:bg-zinc-900'
          }`}
        >
          Choreographies
        </button>
        <button
          type="button"
          onClick={() => setTab('schedule')}
          className={`px-4 py-2 rounded-t-md text-sm font-medium transition-colors ${
            tab === 'schedule'
              ? 'bg-white dark:bg-zinc-900 border-x border-t border-gray-200 dark:border-gray-800 text-purple-700 dark:text-purple-300'
              : 'text-gray-600 dark:text-gray-300 hover:text-purple-700 hover:bg-gray-100 dark:hover:bg-zinc-900'
          }`}
        >
          Schedule
        </button>
      </div>

      <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-zinc-900 p-6 min-h-[300px] relative">
        {tab === 'choreographies' && email === 'jhu.eclectics@gmail.com' && (
          <div className="absolute top-4 right-4">
            <Link href="/choreographies/new" className="inline-flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-3 py-2 rounded shadow">
              + Add Choreography
            </Link>
          </div>
        )}
        {tab === 'choreographies' ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Choreographies</h2>
            {choreographies.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">No choreographies yet.</p>
            ) : (
              <ul className="space-y-2">
                {choreographies.map((c: any) => (
                  <li key={c.id} className="border rounded p-3 hover:shadow">
                    <Link href={`/choreographies/${c.id}`} className="block">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{c.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{c.choreographer?.name || c.choreographer?.email}</div>
                        </div>
                        <div className="text-sm text-purple-600">View</div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Schedule</h2>
            <p className="text-gray-600 dark:text-gray-400">Your schedule will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
