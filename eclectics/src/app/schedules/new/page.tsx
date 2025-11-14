import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ScheduleForm from './ScheduleForm';

export default async function NewSchedulePage() {
  const jar = await cookies();
  const raw = jar.get('session')?.value;
  let isAdmin = false;
  if (raw) {
    try { const parsed: { email?: string } = JSON.parse(decodeURIComponent(raw)); if (parsed.email === 'jhu.eclectics@gmail.com') isAdmin = true; } catch {}
  }
  if (!isAdmin) redirect('/');

  return (
    <div className="max-w-3xl mx-auto py-10 px-6">
      <h1 className="text-2xl font-semibold mb-6">Create Schedule</h1>
      <ScheduleForm />
    </div>
  );
}
