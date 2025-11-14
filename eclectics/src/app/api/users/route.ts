import { NextRequest } from 'next/server';
import { db } from '@/src/database/client';
import { users, choreographies } from '@/src/database/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

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

export async function GET() {
  if (!(await isAdmin())) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
  }
  const all = await db.select({ id: users.id, email: users.email, name: users.name, createdAt: users.createdAt }).from(users).orderBy(users.createdAt);
  return Response.json(all);
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
  }
  const body = await req.json();
  if (!body.email) {
    return new Response(JSON.stringify({ error: 'email required' }), { status: 400 });
  }
  const existing = await db.select().from(users).where(eq(users.email, body.email));
  if (existing.length) {
    return new Response(JSON.stringify({ error: 'user exists' }), { status: 409 });
  }
  const inserted = await db.insert(users).values({ email: body.email, name: body.name }).returning({ id: users.id, email: users.email, name: users.name, createdAt: users.createdAt });
  return Response.json(inserted[0]);
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
  }
  const url = new URL(req.url);
  const idStr = url.searchParams.get('id');
  if (!idStr) return new Response(JSON.stringify({ error: 'id required' }), { status: 400 });
  const id = Number(idStr);
  if (Number.isNaN(id)) return new Response(JSON.stringify({ error: 'invalid id' }), { status: 400 });
  // Prevent deleting if referenced by choreographies
  const refs = await db.select({ id: choreographies.id }).from(choreographies).where(eq(choreographies.choreographerUserId, id)).limit(1);
  if (refs.length) {
    return new Response(JSON.stringify({ error: 'User has choreographies; reassign or delete them first.' }), { status: 409 });
  }
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.id, id));
  if (!existing.length) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  await db.delete(users).where(eq(users.id, id));
  return new Response(null, { status: 204 });
}
