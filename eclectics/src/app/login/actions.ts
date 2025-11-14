"use server";
import { headers } from 'next/headers';

export async function loginWithEmail(formData: FormData) {
  const email = formData.get('email');
  const password = formData.get('password');
  if (!email || typeof email !== 'string') {
    return { error: 'Email required' };
  }
  if (!password || typeof password !== 'string') {
    return { error: 'Password required' };
  }
  let origin: string | null = null;
  try {
    const h = await headers();
    origin = h.get('origin');
  } catch {}
  const base = origin || process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  let res: Response;
  try {
    res = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });
  } catch {
    return { error: 'Unable to reach auth service.' };
  }
  if (res.status === 404) {
    return { error: 'User not found. Please sign up.' };
  } else if (res.status === 401) {
    return { error: 'Invalid email or password.' };
  } else if (!res.ok) {
    return { error: 'Login failed.' };
  }
  return { success: true };
}
 
