import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import SignupForm from './SignupForm';

export default async function SignupPage() {
  const cookieStore = await cookies();
  const raw = cookieStore.get('session')?.value;
  if (raw) {
    try {
      const parsed = JSON.parse(decodeURIComponent(raw));
      if (parsed?.id && parsed?.email) {
        redirect('/');
      }
    } catch {
      // ignore and show signup form
    }
  }
  return <SignupForm />;
}
