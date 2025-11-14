import { db } from '@/src/database/client';
import { schedules } from '@/src/database/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { cookies } from 'next/headers';
import DeleteScheduleButton from '../../_components/DeleteScheduleButton';

type Params = { params: { id: string } } | { params: Promise<{ id: string }> };

export default async function SchedulePage({ params }: Params) {
  const resolved = (typeof (params as Promise<{ id: string }>).then === 'function')
    ? await (params as Promise<{ id: string }>)
    : (params as { id: string });
  const id = Number(resolved.id);
  if (Number.isNaN(id)) notFound();

  const rows = await db.select().from(schedules).where(eq(schedules.id, id));
  if (!rows.length) notFound();
  const s = rows[0];

  const jar = await cookies();
  const raw = jar.get('session')?.value;
  let isAdmin = false;
  if (raw) {
    try { const parsed: { email?: string } = JSON.parse(decodeURIComponent(raw)); if (parsed.email === 'jhu.eclectics@gmail.com') isAdmin = true; } catch {}
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-purple-600 hover:underline">← Back to list</Link>
        </div>
        {isAdmin && (
          <div>
            <Link
              href={`/schedules/${s.id}/edit`}
              className="inline-flex items-center gap-1 text-sm text-gray-700 bg-white border border-gray-300 px-3 py-1.5 rounded-md shadow-sm hover:bg-gray-50 active:scale-95 transition focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              Edit
            </Link>
          </div>
        )}
      </div>
      <h1 className="text-2xl font-semibold mb-1">{s.title}</h1>
      {s.type && (
        <div className="mb-2">
          <span className="inline-flex items-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-0.5 text-xs font-medium">
            {s.type}
          </span>
        </div>
      )}
      <div className="text-sm text-gray-600 mb-4">
        {s.date} {s.startTime || s.time}{(s.endTime || s.startTime) ? ' – ' + (s.endTime || s.startTime) : ''} · {s.location}
      </div>
      {s.description && (
        <div className="prose prose-sm mb-4">{s.description}</div>
      )}
      {isAdmin && <DeleteScheduleButton id={s.id} />}
    </div>
  );
}
