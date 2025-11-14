"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HomeTabs() {
  const [tab, setTab] = useState<'choreographies' | 'schedule'>('choreographies');
  const [email, setEmail] = useState<string | null>(null);
  const [choreographies, setChoreographies] = useState<Array<any>>([]);
  const [schedules, setSchedules] = useState<Array<any>>([]);
  
  function toEventDate(dateStr: string, timeStr?: string): Date | null {
    try {
      const [y, m, d] = dateStr.split('-').map((v) => parseInt(v, 10));
      if (!y || !m || !d) return null;
      let hours = 23, minutes = 59; // default to end-of-day when time missing
      if (timeStr && timeStr.trim()) {
        const raw = timeStr.trim();
        const ampmMatch = raw.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
        if (ampmMatch) {
          let hh = parseInt(ampmMatch[1], 10);
          const mm = parseInt(ampmMatch[2], 10);
          const ampm = ampmMatch[3].toUpperCase();
          if (ampm === 'PM' && hh < 12) hh += 12;
          if (ampm === 'AM' && hh === 12) hh = 0;
          hours = hh; minutes = mm;
        } else {
          const hmMatch = raw.match(/^(\d{1,2}):(\d{2})$/);
          if (hmMatch) {
            hours = parseInt(hmMatch[1], 10);
            minutes = parseInt(hmMatch[2], 10);
          }
        }
      }
      return new Date(y, m - 1, d, hours, minutes, 0, 0);
    } catch {
      return null;
    }
  }
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
    // fetch schedules
    (async () => {
      try {
        const r = await fetch('/api/schedules', { cache: 'no-store' });
        if (!mounted) return;
        if (r.ok) {
          const list = await r.json();
          setSchedules(list || []);
        } else {
          setSchedules([]);
        }
      } catch {
        if (mounted) setSchedules([]);
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
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Schedule</h2>
              {email === 'jhu.eclectics@gmail.com' && (
                <Link href="/schedules/new" className="inline-flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-3 py-2 rounded shadow">
                  + Add Schedule
                </Link>
              )}
            </div>
            {(() => {
              const now = new Date();
              const upcoming = schedules
                .map((s: any) => ({ ...s, _dt: toEventDate(s.date, s.time) }))
                .filter((s: any) => s._dt instanceof Date && (s._dt as Date) >= now)
                .sort((a: any, b: any) => ((a._dt as Date).getTime() - (b._dt as Date).getTime()));
              if (upcoming.length === 0) {
                return <p className="text-gray-600 dark:text-gray-400">No upcoming schedule.</p>;
              }
              return (
                <ul className="space-y-2">
                  {upcoming.map((s: any) => {
                    const dt = s._dt as Date;
                    const dateStr = new Intl.DateTimeFormat('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric'
                    }).format(dt);
                    const hasTime = !!(s.time && String(s.time).trim());
                    const timeStr = hasTime
                      ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(dt)
                      : '';
                    const when = hasTime ? `${dateStr}, ${timeStr}` : dateStr;
                    return (
                      <li key={s.id} className="border rounded p-3 hover:shadow">
                        <Link href={`/schedules/${s.id}`} className="block">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.title}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{when}</div>
                            {s.type && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.type}</div>
                            )}
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
