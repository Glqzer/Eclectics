"use server";
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '@/src/database/client';
import { users } from '@/src/database/schema';
import { eq } from 'drizzle-orm';

const SignupActionSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function signupWithEmail(formData: FormData) {
  const raw = {
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  };
  const parsed = SignupActionSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: 'Name, email and valid password required' };
  }
  const { name, email, password } = parsed.data;

  try {
    const existing = await db.select().from(users).where(eq(users.email, email));
    if (existing.length) {
      return { error: 'User already exists. Please log in.' };
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const inserted = await db
      .insert(users)
      .values({ name, email, passwordHash })
      .returning();

    const sessionValue = encodeURIComponent(JSON.stringify({ id: inserted[0].id, email }));
    const jar = await cookies();
    jar.set('session', sessionValue, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  } catch {
    return { error: 'Sign up failed.' };
  }

  // Important: perform redirect outside try/catch so it isn't swallowed
  redirect('/');
}
 
