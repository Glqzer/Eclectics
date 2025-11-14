"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function HomeTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'choreographies' | 'schedule'>('choreographies');
  const [email, setEmail] = useState<string | null>(null);
  const [choreographies, setChoreographies] = useState<Array<any>>([]);
  const [schedules, setSchedules] = useState<Array<any>>([]);
  const [schedulePage, setSchedulePage] = useState<number>(1);
  
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
  // Initialize tab and page from URL (?tab=schedule|choreographies&?page=1..)
  useEffect(() => {
    const qp = searchParams?.get('tab');
    if (qp === 'schedule' || qp === 'choreographies') {
      setTab(qp);
    }
    const p = parseInt(searchParams?.get('page') || '1', 10);
    if (!Number.isNaN(p) && p > 0) setSchedulePage(p);
  }, [searchParams]);

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

  function switchTab(next: 'choreographies' | 'schedule') {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', next);
    if (next === 'schedule') {
      url.searchParams.set('page', String(schedulePage));
    } else {
      url.searchParams.delete('page');
    }
    router.replace(url.pathname + '?' + url.searchParams.toString());
  }

  function gotoSchedulePage(p: number, totalPages: number) {
    const clamped = Math.max(1, Math.min(totalPages, p));
    setSchedulePage(clamped);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', 'schedule');
    url.searchParams.set('page', String(clamped));
    router.replace(url.pathname + '?' + url.searchParams.toString());
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 mb-6">
        <button
          type="button"
          onClick={() => switchTab('choreographies')}
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
          onClick={() => switchTab('schedule')}
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
                    <Link href={`/choreographies/${c.id}`} className="block group rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 transition active:scale-[0.98]">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{c.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{c.choreographer?.name || c.choreographer?.email}</div>
                        </div>
                        <div>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 px-2.5 py-1 rounded-full transition-colors group-hover:bg-purple-100 group-active:scale-95">
                            View
                            <span aria-hidden>→</span>
                          </span>
                        </div>
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
                .map((s: any) => ({
                  ...s,
                  _start: toEventDate(s.date, s.startTime || s.time),
                  _end: toEventDate(s.date, s.endTime || s.startTime || s.time)
                }))
                .filter((s: any) => s._end instanceof Date && (s._end as Date) >= now)
                .sort((a: any, b: any) => ((a._start as Date).getTime() - (b._start as Date).getTime()));
              if (upcoming.length === 0) {
                return <p className="text-gray-600 dark:text-gray-400">No upcoming schedule.</p>;
              }
              const pageSize = 10;
              const totalPages = Math.max(1, Math.ceil(upcoming.length / pageSize));
              const currentPage = Math.min(schedulePage, totalPages);
              const start = (currentPage - 1) * pageSize;
              const pageItems = upcoming.slice(start, start + pageSize);
              return (
                <>
                <ul className="space-y-2">
                  {pageItems.map((s: any) => {
                    const dtStart = s._start as Date;
                    const dtEnd = s._end as Date;
                    const dateStr = new Intl.DateTimeFormat('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric'
                    }).format(dtStart);
                    const nowLocal = new Date();
                    const isToday = dtStart.getFullYear() === nowLocal.getFullYear() && dtStart.getMonth() === nowLocal.getMonth() && dtStart.getDate() === nowLocal.getDate();
                    const tomorrow = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate() + 1);
                    const isTomorrow = dtStart.getFullYear() === tomorrow.getFullYear() && dtStart.getMonth() === tomorrow.getMonth() && dtStart.getDate() === tomorrow.getDate();
                    const monthDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(dtStart);
                    const dateLabel = isToday ? `Today, ${monthDay}` : (isTomorrow ? `Tomorrow, ${monthDay}` : dateStr);
                    const hasStart = !!(s.startTime || s.time);
                    const hasEnd = !!s.endTime;
                    const startStr = hasStart ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(dtStart) : '';
                    const endStr = hasEnd ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(dtEnd) : '';
                    const when = hasStart ? `${dateLabel}, ${startStr}${hasEnd ? ' – ' + endStr : ''}` : dateLabel;
                    // duration calculation in minutes
                    let durationLabel = '';
                    if (hasStart && hasEnd) {
                      const diffMs = dtEnd.getTime() - dtStart.getTime();
                      if (diffMs > 0) {
                        const totalMin = Math.round(diffMs / 60000);
                        const hrs = Math.floor(totalMin / 60);
                        const mins = totalMin % 60;
                        durationLabel = hrs > 0 ? `${hrs}h${mins ? ' '+mins+'m' : ''}` : `${mins}m`;
                      }
                    }
                    return (
                      <li key={s.id} className="border rounded p-3 hover:shadow">
                        <Link href={`/schedules/${s.id}`} className="flex items-center justify-between gap-4 group rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 transition active:scale-[0.98]">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{s.title}</div>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-500 dark:text-gray-400">{when}{s.location ? ` · ${s.location}` : ''}</span>
                              {durationLabel && (
                                <span className="text-xs rounded-full bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 text-gray-600 dark:text-gray-300">{durationLabel}</span>
                              )}
                              {s.type && (
                                <span className="text-xs rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-0.5">{s.type}</span>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 px-2.5 py-1 rounded-full transition-colors group-hover:bg-purple-100 group-active:scale-95">
                              View
                              <span aria-hidden>→</span>
                            </span>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                {upcoming.length > pageSize && (
                  <div className="flex items-center justify-between pt-3">
                    <div className="text-xs text-gray-500">Page {currentPage} of {totalPages}</div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => gotoSchedulePage(currentPage - 1, totalPages)}
                        disabled={currentPage <= 1}
                        className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 active:scale-95 transition focus:outline-none focus:ring-2 focus:ring-purple-400"
                      >
                        Prev
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => gotoSchedulePage(p, totalPages)}
                            className={`${p === currentPage
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}
                              inline-flex items-center justify-center w-8 h-8 text-sm border rounded-md transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-400`}
                            aria-current={p === currentPage ? 'page' : undefined}
                            aria-label={`Go to page ${p}`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => gotoSchedulePage(currentPage + 1, totalPages)}
                        disabled={currentPage >= totalPages}
                        className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 active:scale-95 transition focus:outline-none focus:ring-2 focus:ring-purple-400"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
