import { NextRequest } from 'next/server';
import { db } from '@/src/database/client';
import { schedules } from '@/src/database/schema';
import { cookies } from 'next/headers';
import { z } from 'zod';

const CreateScheduleSchema = z.object({
  title: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}(?: ?[AP]M)?$/i),
  type: z.string().min(1),
  location: z.string().min(1),
  description: z.string().min(1).optional()
});

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
  const inserted = await db.insert(schedules).values(parsed.data).returning();
  return new Response(JSON.stringify(inserted[0]), { status: 201 });
}
