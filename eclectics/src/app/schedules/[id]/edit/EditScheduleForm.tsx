"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EditScheduleForm({ schedule }: { schedule: any }) {
  const router = useRouter();
  const [title, setTitle] = useState(schedule.title || '');
  const [date, setDate] = useState(schedule.date || '');
  const [time, setTime] = useState(schedule.time || '');
  const [type, setType] = useState(schedule.type || '');
  const [location, setLocation] = useState(schedule.location || '');
  const [description, setDescription] = useState(schedule.description || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { title, date, time, type, location, description: description || undefined };
      const res = await fetch(`/api/schedules/${schedule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Update failed');
      }
      router.push(`/schedules/${schedule.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full border rounded px-3 py-2" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Time</label>
          <input value={time} onChange={e => setTime(e.target.value)} placeholder="HH:MM or HH:MM AM/PM" className="w-full border rounded px-3 py-2" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Type</label>
        <input value={type} onChange={e => setType(e.target.value)} className="w-full border rounded px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Location</label>
        <input value={location} onChange={e => setLocation(e.target.value)} className="w-full border rounded px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border rounded px-3 py-2" rows={4} />
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div>
        <button type="submit" disabled={loading} className="bg-purple-600 text-white px-4 py-2 rounded">{loading ? 'Saving...' : 'Save'}</button>
      </div>
    </form>
  );
}
