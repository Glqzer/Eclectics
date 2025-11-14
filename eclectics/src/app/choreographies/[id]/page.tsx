import { db } from '@/src/database/client';
import { choreographies, users } from '@/src/database/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { cookies } from 'next/headers';
import DeleteChoreographyButton from '../../_components/DeleteChoreographyButton';

// In Next.js 16 with React 19, `params` can be provided as a promise.
type Params = { params: { id: string } } | { params: Promise<{ id: string }> };

export default async function ChoreographyPage({ params }: Params) {
  // Await params if it's a promise (Next.js dynamic route change)
  const resolved = (typeof (params as Promise<{ id: string }>).then === 'function')
    ? await (params as Promise<{ id: string }>)
    : (params as { id: string });
  const id = Number(resolved.id);
  if (Number.isNaN(id)) notFound();

  // Determine if current session user is admin
  let isAdmin = false;
  try {
    const jar = await cookies();
    const raw = jar.get('session')?.value;
    if (raw) {
      const parsed = JSON.parse(decodeURIComponent(raw));
      if (parsed?.email === 'jhu.eclectics@gmail.com') {
        isAdmin = true;
      }
    }
  } catch {
    // ignore
  }

  let rows;
  try {
    rows = await db.select({
      id: choreographies.id,
      name: choreographies.name,
      cut: choreographies.cut,
      cleaningVideos: choreographies.cleaningVideos,
      cleaningNotes: choreographies.cleaningNotes,
      createdAt: choreographies.createdAt,
      choreographer: {
        id: users.id,
        name: users.name,
        email: users.email
      }
    }).from(choreographies).leftJoin(users, eq(choreographies.choreographerUserId, users.id)).where(eq(choreographies.id, id));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return (
      <div className="max-w-xl mx-auto py-10 px-6">
        <h1 className="text-xl font-semibold mb-4">Error loading choreography</h1>
        <pre className="text-xs whitespace-pre-wrap bg-red-50 border border-red-200 rounded p-3 text-red-700">{msg}</pre>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="max-w-xl mx-auto py-10 px-6">
        <h1 className="text-xl font-semibold mb-4">Choreography Not Found</h1>
        <p className="text-sm text-gray-600">No choreography with id {id}.</p>
      </div>
    );
  }
  const c = rows[0];


  return (
    <div className="max-w-3xl mx-auto py-10 px-6">
      <div className="mb-6">
        <Link href="/" className="text-sm text-purple-600 hover:underline">← Back to list</Link>
        {isAdmin && (
          <Link
            href={`/choreographies/${c.id}/edit`}
            className="ml-4 inline-flex items-center gap-1 text-sm text-gray-700 bg-white border border-gray-300 px-3 py-1.5 rounded-md shadow-sm hover:bg-gray-50 active:scale-95 transition focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            Edit
          </Link>
        )}
      </div>
      <h1 className="text-2xl font-semibold mb-4">{c.name}</h1>
      <div className="mb-4 text-sm text-gray-600">By {c.choreographer?.name || c.choreographer?.email}</div>
      <div className="space-y-3">
        {c.cut && (
          <div>
            <div className="text-xs text-gray-500">Cut</div>
            <a href={c.cut} target="_blank" rel="noreferrer" className="text-purple-600">Open Audio Cut</a>
          </div>
        )}
        {c.cleaningVideos && (
          <div>
            <div className="text-xs text-gray-500">Cleaning Videos</div>
            <a href={c.cleaningVideos} target="_blank" rel="noreferrer" className="text-purple-600">Open Cleaning Videos</a>
          </div>
        )}
        {c.cleaningNotes && (
          <div>
            <div className="text-xs text-gray-500">Cleaning Notes</div>
            <a href={c.cleaningNotes} target="_blank" rel="noreferrer" className="text-purple-600">Open Cleaning Notes</a>
          </div>
        )}
      </div>
      {isAdmin && <DeleteChoreographyButton id={c.id} />}
    </div>
  );
}
