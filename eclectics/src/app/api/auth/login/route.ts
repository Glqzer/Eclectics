import { NextRequest } from 'next/server';
import { db } from '@/src/database/client';
import { users } from '@/src/database/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = LoginSchema.safeParse(json);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
  }
  const { email, password } = parsed.data;

  const rows = await db.select().from(users).where(eq(users.email, email));
  if (!rows.length || !rows[0].passwordHash) {
    return new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 401 });
  }
  const match = await bcrypt.compare(password, rows[0].passwordHash!);
  if (!match) {
    return new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 401 });
  }

  const sessionValue = encodeURIComponent(JSON.stringify({ id: rows[0].id, email }));
  const cookieStore = await cookies();
  cookieStore.set('session', sessionValue, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  });

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
