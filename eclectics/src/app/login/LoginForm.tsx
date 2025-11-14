"use client";
import Link from 'next/link';
import { loginWithEmail } from './actions';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginForm() {
  const [state, formAction] = useActionState(
    async (_prevState: { error: string; success: boolean }, formData: FormData) => {
      const result = await loginWithEmail(formData);
      return {
        error: result?.error || '',
        success: !!(result as any)?.success,
      };
    },
    { error: '', success: false }
  );
  const { pending } = useFormStatus();
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.push('/');
    }
  }, [state.success, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-200">
      <div className="bg-white shadow-xl rounded-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-purple-700">Log in to Eclectics</h1>
        <form action={formAction} className="space-y-4">
          <input
            type="email"
            name="email"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
            placeholder="Email address"
            required
          />
          <input
            type="password"
            name="password"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
            placeholder="Password"
            required
          />
          {state.error && (
            <div className="text-red-500 text-sm">
              {state.error} <Link href="/signup" className="underline">Sign up?</Link>
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded transition-colors"
            disabled={pending}
          >
            {pending ? 'Logging in...' : 'Log in'}
          </button>
        </form>
        <div className="mt-6 text-center text-gray-500 text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-purple-600 hover:underline">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
