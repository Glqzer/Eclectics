import { NextRequest } from 'next/server';
import { db } from '@/src/database/client';
import { schedules } from '@/src/database/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { z } from 'zod';

async function isAdmin(): Promise<boolean> {
  try {
    const jar = await cookies();
    const raw = jar.get('session')?.value;
    if (!raw) return false;
    const parsed: { email?: string } = JSON.parse(decodeURIComponent(raw));
    return parsed.email === 'jhu.eclectics@gmail.com';
  } catch {
    return false;
  }
}

const timePattern = /^\d{2}:\d{2}(?: ?[AP]M)?$/i;
const PatchSchema = z.object({
  title: z.string().min(1).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startTime: z.string().regex(timePattern).optional(),
  endTime: z.union([z.string().regex(timePattern), z.null()]).optional(),
  type: z.enum(['workshop','teaching','blocking','cleaning','performance','social','other']).optional(),
  location: z.string().min(1).optional(),
  description: z.string().min(1).optional()
}).refine(obj => Object.keys(obj).length > 0, { message: 'At least one field required' })
  .refine(obj => {
    // Only compare when both are provided as strings (not null)
    if (!obj.startTime || obj.endTime == null) return true;
    function toMinutes(t: string) {
      const ampm = /(AM|PM)$/i.test(t) ? t.slice(-2).toUpperCase() : '';
      const [hhRaw, mmRaw] = t.replace(/(AM|PM)$/i, '').trim().split(':');
      let hh = parseInt(hhRaw, 10); const mm = parseInt(mmRaw, 10);
      if (ampm === 'PM' && hh < 12) hh += 12;
      if (ampm === 'AM' && hh === 12) hh = 0;
      return hh * 60 + mm;
    }
    return toMinutes(obj.endTime) >= toMinutes(obj.startTime);
  }, { message: 'endTime must be after startTime' });

// GET /api/schedules/[id] - public
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const num = Number(id);
  if (Number.isNaN(num)) return new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400 });
  const rows = await db.select().from(schedules).where(eq(schedules.id, num));
  if (!rows.length) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  return Response.json(rows[0]);
}

// PATCH /api/schedules/[id] - admin only
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
  }
  const { id } = await params;
  const num = Number(id);
  if (Number.isNaN(num)) return new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400 });
  const json = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.errors[0]?.message || 'Invalid payload' }), { status: 400 });
  }
  // Normalize update values; allow clearing endTime by sending null
  const updateValues: Record<string, unknown> = { ...parsed.data };
  if (Object.keys(updateValues).length === 0) {
    return new Response(JSON.stringify({ error: 'Nothing to update' }), { status: 400 });
  }
  const existing = await db.select({ id: schedules.id }).from(schedules).where(eq(schedules.id, num));
  if (!existing.length) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  const updated = await db.update(schedules).set(updateValues).where(eq(schedules.id, num)).returning();
  return Response.json(updated[0]);
}

// DELETE /api/schedules/[id] - admin only
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
  }
  const { id } = await params;
  const num = Number(id);
  if (Number.isNaN(num)) return new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400 });
  const existing = await db.select({ id: schedules.id }).from(schedules).where(eq(schedules.id, num));
  if (!existing.length) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  await db.delete(schedules).where(eq(schedules.id, num));
  return new Response(null, { status: 204 });
}
