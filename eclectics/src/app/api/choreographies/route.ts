import { db } from '@/src/database/client';
import { choreographies, users } from '@/src/database/schema';
import { eq } from 'drizzle-orm';

// GET /api/choreographies - get all choreographies with choreographer info
export async function GET() {
  try {
    const all = await db.select({
      id: choreographies.id,
      name: choreographies.name,
      cut: choreographies.cut,
      cleaningVideos: choreographies.cleaningVideos,
      cleaningNotes: choreographies.cleaningNotes,
      blockingSlides: choreographies.blockingSlides,
      createdAt: choreographies.createdAt,
      choreographer: {
        id: users.id,
        name: users.name,
        email: users.email
      }
    })
      .from(choreographies)
      .leftJoin(users, eq(choreographies.choreographerUserId, users.id));
    return Response.json(all);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack?.split('\n')?.slice(0, 5) : undefined;
    // Return error details to help debug 500s in dev
    return new Response(JSON.stringify({ error: 'DB error', message, stack }), { status: 500 });
  }
}

// POST /api/choreographies - admin only
export async function POST(req: Request) {
  const ADMIN_EMAIL = 'jhu.eclectics@gmail.com';
  const cookie = req.headers.get('cookie') || '';
  // Simple cookie parsing for 'session' cookie
  const sessionMatch = cookie.match(/(?:^|; )session=([^;]*)/);
  let email = '';
  if (sessionMatch) {
    try {
      // Assume session cookie is just the email, or a JSON string with { email }
      const val = decodeURIComponent(sessionMatch[1]);
      if (val.startsWith('{')) {
        email = JSON.parse(val).email;
      } else {
        email = val;
      }
    } catch {}
  }
  if (email !== ADMIN_EMAIL) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }
  const { choreographerUserId, name, cut, cleaningVideos, cleaningNotes, blockingSlides } = body;
  if (!choreographerUserId || !name || !cut || !cleaningVideos || !cleaningNotes) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }
  // Check if user exists
  const user = await db.select().from(users).where(eq(users.id, choreographerUserId));
  if (!user.length) {
    return new Response(JSON.stringify({ error: 'Choreographer user not found' }), { status: 404 });
  }
  const inserted = await db.insert(choreographies).values({
    choreographerUserId,
    name,
    cut,
    cleaningVideos,
    cleaningNotes,
    blockingSlides
  }).returning();
  return Response.json(inserted[0]);
}
