"use server";
import { cookies } from 'next/headers';
import { db } from '@/src/database/client';
import { choreographies, users } from '@/src/database/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export async function createChoreography(formData: FormData) {
  const jar = await cookies();
  const raw = jar.get('session')?.value;
  if (!raw) return { error: 'Not authenticated' };
  let parsed: any;
  try { parsed = JSON.parse(decodeURIComponent(raw)); } catch { return { error: 'Invalid session' }; }
  const ADMIN_EMAIL = 'jhu.eclectics@gmail.com';
  if (parsed.email !== ADMIN_EMAIL) return { error: 'Unauthorized' };
  const choreographerIdRaw = formData.get('choreographerUserId');
  const name = (formData.get('name') || '').toString().trim();
  const cut = (formData.get('cut') || '').toString().trim();
  const cleaningVideo = (formData.get('cleaningVideo') || '').toString().trim();
  const cleaningNote = (formData.get('cleaningNote') || '').toString().trim();

  if (!choreographerIdRaw) return { error: 'Choreographer required' };
  const choreographerUserId = parseInt(choreographerIdRaw.toString(), 10);
  if (Number.isNaN(choreographerUserId)) return { error: 'Invalid choreographer' };
  if (!name) return { error: 'Name required' };

  // verify choreographer user exists
  const userRows = await db.select().from(users).where(eq(users.id, choreographerUserId));
  if (!userRows.length) return { error: 'Choreographer user not found' };

  await db.insert(choreographies).values({
    choreographerUserId,
    name,
    cut: cut || null,
    cleaningVideos: cleaningVideo || null,
    cleaningNotes: cleaningNote || null,
  });

  redirect('/');
}
