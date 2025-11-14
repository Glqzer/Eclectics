"use server";
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/src/database/client';
import { users } from '@/src/database/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

export async function loginWithEmail(formData: FormData) {
  const raw = { email: formData.get('email'), password: formData.get('password') };
  const LoginActionSchema = z.object({ email: z.string().email(), password: z.string().min(6) });
  const parsed = LoginActionSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: 'Email and password required' };
  }
  const { email, password } = parsed.data;

  try {
    const rows = await db.select().from(users).where(eq(users.email, email));
    if (!rows.length || !rows[0].passwordHash) {
      return { error: 'Invalid email or password.' };
    }
    const match = await bcrypt.compare(password, rows[0].passwordHash!);
    if (!match) {
      return { error: 'Invalid email or password.' };
    }

    const sessionValue = encodeURIComponent(JSON.stringify({ id: rows[0].id, email }));
    const jar = await cookies();
    jar.set('session', sessionValue, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  } catch {
    return { error: 'Login failed.' };
  }

  // Redirect outside try/catch so RedirectError isn't swallowed
  redirect('/');
}
 
