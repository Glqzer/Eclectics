import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LoginForm from './LoginForm';

export default async function LoginPage() {
  const cookieStore = await cookies();
  const raw = cookieStore.get('session')?.value;
  if (raw) {
    try {
      const parsed = JSON.parse(decodeURIComponent(raw));
      if (parsed?.id && parsed?.email) {
        redirect('/');
      }
    } catch {
      // ignore and show login form
    }
  }
  return <LoginForm />;
}
