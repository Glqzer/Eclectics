import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import HomeTabs from './_components/HomeTabs';

export default async function Home() {
  const cookieStore = await cookies();
  const raw = cookieStore.get('session')?.value;
  if (!raw) {
    redirect('/login');
  }
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (!parsed?.id || !parsed?.email) {
      redirect('/login');
    }
  } catch {
    redirect('/login');
  }
  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 font-sans dark:bg-black py-10">
      <main className="w-full max-w-5xl px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-purple-700">Welcome!</h1>
        </div>

        <HomeTabs />
      </main>
    </div>
  );
}
