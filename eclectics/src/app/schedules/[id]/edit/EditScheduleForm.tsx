"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EditScheduleForm({ schedule }: { schedule: any }) {
  const router = useRouter();
  const [title, setTitle] = useState(schedule.title || '');
  const [date, setDate] = useState(schedule.date || '');
  const [startTime, setStartTime] = useState(schedule.startTime || schedule.time || '');
  const [endTime, setEndTime] = useState(schedule.endTime || '');
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
      const normalizedEnd = (endTime ?? '').toString().trim() === '' ? null : endTime;
      const normalizedStart = (startTime ?? '').toString().trim() === '' ? undefined : startTime;
      const payload: Record<string, unknown> = {
        title,
        date,
        startTime: normalizedStart,
        endTime: normalizedEnd,
        type,
        location,
        description: description || undefined,
      };
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
        <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full border rounded px-3 py-2 text-black bg-white form-input" placeholder="Title" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full border rounded px-3 py-2 text-black bg-white form-input" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Start Time</label>
          <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full border rounded px-3 py-2 text-black bg-white form-input" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Time</label>
          <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full border rounded px-3 py-2 text-black bg-white form-input" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Type</label>
        <select value={type} onChange={e => setType(e.target.value)} className="w-full border rounded px-3 py-2 bg-white dark:bg-zinc-900 text-black form-input">
          <option value="" disabled>Select a type</option>
          <option value="workshop">workshop</option>
          <option value="teaching">teaching</option>
          <option value="blocking">blocking</option>
          <option value="cleaning">cleaning</option>
          <option value="performance">performance</option>
          <option value="social">social</option>
          <option value="other">other</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Location</label>
        <input value={location} onChange={e => setLocation(e.target.value)} className="w-full border rounded px-3 py-2 text-black bg-white form-input" placeholder="Location" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border rounded px-3 py-2 text-black bg-white form-input" rows={4} placeholder="Optional description" />
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div>
        <button type="submit" disabled={loading} className="bg-purple-600 text-white px-4 py-2 rounded">{loading ? 'Saving...' : 'Save'}</button>
      </div>
    </form>
  );
}
