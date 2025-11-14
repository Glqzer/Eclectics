import { NextRequest, NextResponse } from 'next/server';
import webPush from 'web-push';
import { db } from '@/src/database/client';
import { pushSubscriptions, schedules, sentNotifications } from '@/src/database/schema';
import { and, eq, gte, lte, notExists, sql } from 'drizzle-orm';

function toStartDate(dateStr: string, timeStr: string | null): Date | null {
  try {
    const [y, m, d] = dateStr.split('-').map((v) => parseInt(v, 10));
    if (!y || !m || !d) return null;
    let hours = 0, minutes = 0;
    if (timeStr && timeStr.trim()) {
      const raw = timeStr.trim();
      const ampmMatch = raw.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
      if (ampmMatch) {
        let hh = parseInt(ampmMatch[1], 10);
        const mm = parseInt(ampmMatch[2], 10);
        const ampm = ampmMatch[3].toUpperCase();
        if (ampm === 'PM' && hh < 12) hh += 12;
        if (ampm === 'AM' && hh === 12) hh = 0;
        hours = hh; minutes = mm;
      } else {
        const hmMatch = raw.match(/^(\d{1,2}):(\d{2})$/);
        if (hmMatch) {
          hours = parseInt(hmMatch[1], 10);
          minutes = parseInt(hmMatch[2], 10);
        }
      }
    }
    return new Date(y, m - 1, d, hours, minutes, 0, 0);
  } catch {
    return null;
  }
}

export const runtime = 'nodejs';

async function handleDispatch() {
  const publicKey = process.env.VAPID_PUBLIC_KEY as string;
  const privateKey = process.env.VAPID_PRIVATE_KEY as string;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';
  if (!publicKey || !privateKey) {
    return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 500 });
  }
  webPush.setVapidDetails(subject, publicKey, privateKey);

  const now = new Date();
  const target = new Date(now.getTime() + 30 * 60 * 1000);

  // Fetch schedules starting within the next 30 minutes
  const all = await db.select().from(schedules);
  const upcoming = all.filter((s) => {
    const dt = toStartDate(s.date, (s as any).startTime || (s as any).time);
    return dt instanceof Date && dt >= now && dt <= target;
  });

  if (upcoming.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  const subs = await db.select().from(pushSubscriptions);
  let sentCount = 0;
  for (const s of upcoming) {
    const startDt = toStartDate(s.date as any, (s as any).startTime || (s as any).time);
    const startStr = startDt ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(startDt) : (s as any).startTime;
    for (const sub of subs) {
      // check if already sent
      const already = await db.select().from(sentNotifications).where(and(
        eq(sentNotifications.subscriptionEndpoint, sub.endpoint),
        eq(sentNotifications.scheduleId, (s as any).id)
      ));
      if (already.length) continue;
      try {
        await webPush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh as any, auth: sub.auth as any } } as any, JSON.stringify({
          title: s.title + ' in 30 minutes',
          body: `${s.title} starts at ${startStr}${(s as any).location ? ` · ${(s as any).location}` : ''}`,
          url: `/schedules/${(s as any).id}`,
        }));
        await db.insert(sentNotifications).values({ subscriptionEndpoint: sub.endpoint, scheduleId: (s as any).id });
        sentCount++;
      } catch (e) {
        // If subscription is gone, ignore; consider cleanup in future
      }
    }
  }

  return NextResponse.json({ ok: true, sent: sentCount });
}

export async function POST(_req: NextRequest) {
  return handleDispatch();
}

export async function GET(_req: NextRequest) {
  return handleDispatch();
}
