import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/src/database/client';
import { users } from '@/src/database/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const jar = await cookies();
  const raw = jar.get('session')?.value;
  if (!raw) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    let name: string | null = null;
    if (parsed?.id) {
      try {
        const row = await db.select({ name: users.name }).from(users).where(eq(users.id, parsed.id));
        if (row.length && row[0].name) name = row[0].name;
      } catch {}
    }
    return new Response(JSON.stringify({ id: parsed.id, email: parsed.email, name }), { status: 200 });
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401 });
  }
}
