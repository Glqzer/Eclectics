import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createChoreography } from './actions';
import { db } from '@/src/database/client';
import { users } from '@/src/database/schema';
import { eq } from 'drizzle-orm';

export default async function NewChoreographyPage() {
  const jar = await cookies();
  const raw = jar.get('session')?.value;
  if (!raw) redirect('/login');
  let parsed: any;
  try { parsed = JSON.parse(decodeURIComponent(raw)); } catch { redirect('/login'); }
  if (parsed.email !== 'jhu.eclectics@gmail.com') redirect('/');
  // fetch users for choreographer select
  const usersList = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).orderBy(users.name);

  async function action(formData: FormData): Promise<void> {
    'use server';
    await createChoreography(formData);
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-6">
      <h1 className="text-2xl font-semibold mb-6">Add Choreography</h1>
      <form action={action} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="name">Choreography Name</label>
          <input id="name" name="name" type="text" className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-black bg-white form-input" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="choreographerUserId">Choreographer <span className="text-xs text-gray-500">(optional – defaults to you)</span></label>
          <select id="choreographerUserId" name="choreographerUserId" className="w-full border border-gray-300 rounded px-3 py-2 text-black bg-white form-input">
            <option value="">(Use my account)</option>
            {usersList.map(u => (
              <option key={u.id} value={u.id}>{u.name ? `${u.name} (${u.email})` : u.email}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="cut">Link to cut <span className="text-xs text-gray-500">(optional)</span></label>
          <input id="cut" name="cut" type="url" className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-black bg-white form-input" placeholder="https://" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="cleaningVideo">Link to cleaning video <span className="text-xs text-gray-500">(optional)</span></label>
          <input id="cleaningVideo" name="cleaningVideo" type="url" className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-black bg-white form-input" placeholder="https://" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="cleaningNote">Link to cleaning note <span className="text-xs text-gray-500">(optional)</span></label>
          <input id="cleaningNote" name="cleaningNote" type="url" className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-black bg-white form-input" placeholder="https://" />
        </div>
        <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2 rounded transition-colors">Create</button>
      </form>
    </div>
  );
}
