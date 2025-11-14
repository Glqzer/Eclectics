import { NextRequest } from 'next/server';
import { db } from '@/src/database/client';
import { schedules } from '@/src/database/schema';
import { cookies } from 'next/headers';
import { z } from 'zod';

const timePattern = /^\d{2}:\d{2}(?: ?[AP]M)?$/i;
const CreateScheduleSchema = z.object({
  title: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(timePattern),
  endTime: z.string().regex(timePattern),
  type: z.enum(['workshop','teaching','blocking','cleaning','performance','social','other']),
  location: z.string().min(1),
  description: z.string().min(1).optional()
}).refine(d => {
  // simple comparison by converting both to minutes since midnight (24h assumed)
  function toMinutes(t: string) {
    const ampm = /(AM|PM)$/i.test(t) ? t.slice(-2).toUpperCase() : '';
    const [hhRaw, mmRaw] = t.replace(/(AM|PM)$/i, '').trim().split(':');
    let hh = parseInt(hhRaw, 10); const mm = parseInt(mmRaw, 10);
    if (ampm === 'PM' && hh < 12) hh += 12;
    if (ampm === 'AM' && hh === 12) hh = 0;
    return hh * 60 + mm;
  }
  return toMinutes(d.endTime) >= toMinutes(d.startTime);
}, { message: 'endTime must be after startTime' });

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

// GET /api/schedules - public
export async function GET() {
  const rows = await db.select().from(schedules).orderBy(schedules.date, schedules.time);
  return Response.json(rows);
}

// POST /api/schedules - admin only
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
  }
  const json = await req.json().catch(() => null);
  const parsed = CreateScheduleSchema.safeParse(json);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
  }
  const { title, date, startTime, endTime, type, location, description } = parsed.data as any;
  const inserted = await db.insert(schedules).values({ title, date, startTime, endTime, type, location, description }).returning();
  return new Response(JSON.stringify(inserted[0]), { status: 201 });
}
