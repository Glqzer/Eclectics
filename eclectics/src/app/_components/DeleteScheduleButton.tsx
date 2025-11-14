"use client";
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface Props { id: number }

export default function DeleteScheduleButton({ id }: Props) {
  const [error, setError] = useState<string>('');
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onDelete() {
    if (!confirm('Delete this schedule permanently?')) return;
    setError('');
    startTransition(async () => {
      try {
        const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
        if (res.status === 204) {
          router.push('/');
          router.refresh();
          return;
        }
        let msg = 'Delete failed';
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
        } catch {}
        setError(msg);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <div className="mt-10 border-t pt-6">
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded"
      >
        {pending ? 'Deleting...' : 'Delete schedule'}
      </button>
      {error && <div className="mt-3 text-xs text-red-600">{error}</div>}
    </div>
  );
}
