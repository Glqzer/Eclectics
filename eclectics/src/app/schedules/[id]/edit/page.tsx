import { db } from '@/src/database/client';
import { schedules } from '@/src/database/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import EditScheduleForm from './EditScheduleForm';

type Params = { params: { id: string } } | { params: Promise<{ id: string }> };

export default async function EditSchedulePage({ params }: Params) {
  const resolved = (typeof (params as Promise<{ id: string }>).then === 'function')
    ? await (params as Promise<{ id: string }>)
    : (params as { id: string });
  const id = Number(resolved.id);
  if (Number.isNaN(id)) notFound();

  // admin-only
  const jar = await cookies();
  const raw = jar.get('session')?.value;
  let isAdmin = false;
  if (raw) {
    try { const parsed: { email?: string } = JSON.parse(decodeURIComponent(raw)); if (parsed.email === 'jhu.eclectics@gmail.com') isAdmin = true; } catch {}
  }
  if (!isAdmin) notFound();

  const rows = await db.select().from(schedules).where(eq(schedules.id, id));
  if (!rows.length) notFound();
  const s = rows[0];

  return (
    <div className="max-w-3xl mx-auto py-10 px-6">
      <h1 className="text-2xl font-semibold mb-6">Edit Schedule</h1>
      <EditScheduleForm schedule={s} />
    </div>
  );
}
