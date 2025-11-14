import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/database/client';
import { pushSubscriptions } from '@/src/database/schema';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sub = body?.subscription;
    if (!sub || !sub.endpoint || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }
    let email: string | undefined = undefined;
    try {
      const jar = await cookies();
      const raw = jar.get('session')?.value;
      if (raw) {
        const parsed = JSON.parse(decodeURIComponent(raw));
        if (parsed?.email) email = parsed.email;
      }
    } catch {}

    // upsert by endpoint
    const existing = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
    if (existing.length) {
      await db.update(pushSubscriptions)
        .set({ p256dh: sub.keys.p256dh, auth: sub.keys.auth, email })
        .where(eq(pushSubscriptions.endpoint, sub.endpoint));
    } else {
      await db.insert(pushSubscriptions).values({ endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth, email });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Subscribe failed' }, { status: 500 });
  }
}
