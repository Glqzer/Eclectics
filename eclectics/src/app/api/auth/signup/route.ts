import { NextRequest } from 'next/server';
import { db } from '@/src/database/client';
import { users } from '@/src/database/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { cookies } from 'next/headers';

const SignupSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6)
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = SignupSchema.safeParse(json);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
  }
  const { email, name, password } = parsed.data;

  const existing = await db.select().from(users).where(eq(users.email, email));
  if (existing.length) {
    return new Response(JSON.stringify({ error: 'User already exists' }), { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const inserted = await db.insert(users).values({ email, name, passwordHash }).returning();

  const sessionValue = encodeURIComponent(JSON.stringify({ id: inserted[0].id, email }));
  const cookieStore = await cookies();
  cookieStore.set('session', sessionValue, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  });

  return new Response(JSON.stringify({ id: inserted[0].id, email, name }), { status: 201 });
}
