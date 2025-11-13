import { NextRequest } from 'next/server';
import { db } from '@/src/database/client';
import { users } from '@/src/database/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const all = await db.select().from(users).limit(50);
  return Response.json(all);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.email) {
    return new Response(JSON.stringify({ error: 'email required' }), { status: 400 });
  }
  const existing = await db.select().from(users).where(eq(users.email, body.email));
  if (existing.length) {
    return new Response(JSON.stringify({ error: 'user exists' }), { status: 409 });
  }
  const inserted = await db.insert(users).values({ email: body.email, name: body.name }).returning();
  return Response.json(inserted[0]);
}
