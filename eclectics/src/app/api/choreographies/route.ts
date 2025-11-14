import { db } from '@/src/database/client';
import { choreographies, users } from '@/src/database/schema';
import { eq } from 'drizzle-orm';

// GET /api/choreographies - get all choreographies with choreographer info
export async function GET() {
  const all = await db.select({
    id: choreographies.id,
    cut: choreographies.cut,
    cleaningVideos: choreographies.cleaningVideos,
    cleaningNotes: choreographies.cleaningNotes,
    createdAt: choreographies.createdAt,
    choreographer: users
  })
    .from(choreographies)
    .leftJoin(users, eq(choreographies.choreographerUserId, users.id));
  return Response.json(all);
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
  const { choreographerUserId, cut, cleaningVideos, cleaningNotes } = body;
  if (!choreographerUserId || !cut || !cleaningVideos || !cleaningNotes) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }
  // Check if user exists
  const user = await db.select().from(users).where(eq(users.id, choreographerUserId));
  if (!user.length) {
    return new Response(JSON.stringify({ error: 'Choreographer user not found' }), { status: 404 });
  }
  const inserted = await db.insert(choreographies).values({
    choreographerUserId,
    cut,
    cleaningVideos,
    cleaningNotes
  }).returning();
  return Response.json(inserted[0]);
}
