"use client";
import Link from 'next/link';
import { signupWithEmail } from './actions';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

export default function SignupPage() {
  const [state, formAction] = useActionState(
    async (_prevState: { error: string }, formData: FormData) => {
      const res = (await signupWithEmail(formData)) as unknown;
      let error = '';
      if (res && typeof res === 'object' && 'error' in res) {
        error = (res as { error?: string }).error || '';
      }
      return { error };
    },
    { error: '' }
  );
  const { pending } = useFormStatus();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-200">
      <div className="bg-white shadow-xl rounded-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-purple-700">Sign up for Eclectics</h1>
        <form action={formAction} className="space-y-4">
          <input
            type="text"
            name="name"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
            placeholder="Name"
            required
          />
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
            placeholder="Password (min 6 chars)"
            required
          />
          {state.error && (
            <div className="text-red-500 text-sm">
              {state.error} <Link href="/login" className="underline">Log in?</Link>
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded transition-colors"
            disabled={pending}
          >
            {pending ? 'Signing up...' : 'Sign up'}
          </button>
        </form>
        <div className="mt-6 text-center text-gray-500 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-purple-600 hover:underline">Log in</Link>
        </div>
      </div>
    </div>
  );
}
