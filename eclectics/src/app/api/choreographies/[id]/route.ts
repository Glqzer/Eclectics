import { db } from '@/src/database/client';
import { choreographies, users } from '@/src/database/schema';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

// GET /api/choreographies/[id] - get a single choreography with choreographer info
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (isNaN(id)) {
    return new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400 });
  }
  const result = await db.select({
    id: choreographies.id,
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
