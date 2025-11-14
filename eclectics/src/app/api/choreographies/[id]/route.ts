import { db } from '@/src/database/client';
import { choreographies, users } from '@/src/database/schema';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

// GET /api/choreographies/[id] - get a single choreography with choreographer info
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (isNaN(id)) {
    return new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400 });
  }
  const result = await db.select({
    id: choreographies.id,
    name: choreographies.name,
    cut: choreographies.cut,
    cleaningVideos: choreographies.cleaningVideos,
    cleaningNotes: choreographies.cleaningNotes,
    createdAt: choreographies.createdAt,
    choreographer: users
  })
    .from(choreographies)
    .leftJoin(users, eq(choreographies.choreographerUserId, users.id))
    .where(eq(choreographies.id, id));
  if (!result.length) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }
  return Response.json(result[0]);
}

// DELETE /api/choreographies/[id] - admin only
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (isNaN(id)) {
    return new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400 });
  }

  // Verify admin via session cookie
  let isAdmin = false;
  try {
    const jar = await cookies();
    const raw = jar.get('session')?.value;
    if (raw) {
      const parsed: { email?: string } = JSON.parse(decodeURIComponent(raw));
      if (parsed.email === 'jhu.eclectics@gmail.com') isAdmin = true;
    }
  } catch {
    // ignore
  }
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
  }

  const existing = await db.select({ id: choreographies.id }).from(choreographies).where(eq(choreographies.id, id));
  if (!existing.length) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }

  await db.delete(choreographies).where(eq(choreographies.id, id));
  return new Response(null, { status: 204 });
}
