import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const jar = await cookies();
  jar.set('session', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return Response.redirect('/login', 303);
}
