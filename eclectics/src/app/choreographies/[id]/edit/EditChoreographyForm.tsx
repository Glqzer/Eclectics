"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ChoreographyShape { id: number; name?: string | null; cut?: string | null; cleaningVideos?: string | null; cleaningNotes?: string | null; blockingSlides?: string | null }

export default function EditChoreographyForm({ choreography }: { choreography: ChoreographyShape }) {
  const router = useRouter();
  const [name, setName] = useState(choreography.name || '');
  const [cut, setCut] = useState(choreography.cut || '');
  const [cleaningVideos, setCleaningVideos] = useState(choreography.cleaningVideos || '');
  const [cleaningNotes, setCleaningNotes] = useState(choreography.cleaningNotes || '');
  const [blockingSlides, setBlockingSlides] = useState(choreography.blockingSlides || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/choreographies/${choreography.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, cut: cut || null, cleaningVideos: cleaningVideos || null, cleaningNotes: cleaningNotes || null, blockingSlides: blockingSlides || null })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Update failed');
      }
      router.push(`/choreographies/${choreography.id}`);
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input value={name} onChange={e => setName(e.target.value)} required className="w-full border rounded px-3 py-2 text-black bg-white form-input" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Link to cut</label>
        <input value={cut} onChange={e => setCut(e.target.value)} className="w-full border rounded px-3 py-2 text-black bg-white form-input" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Link to blocking slides</label>
        <input value={blockingSlides} onChange={e => setBlockingSlides(e.target.value)} className="w-full border rounded px-3 py-2 text-black bg-white form-input" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Link to cleaning video</label>
        <input value={cleaningVideos} onChange={e => setCleaningVideos(e.target.value)} className="w-full border rounded px-3 py-2 text-black bg-white form-input" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Link to cleaning notes</label>
        <input value={cleaningNotes} onChange={e => setCleaningNotes(e.target.value)} className="w-full border rounded px-3 py-2 text-black bg-white form-input" />
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div>
        <button type="submit" disabled={loading} className="bg-purple-600 text-white px-4 py-2 rounded">{loading ? 'Saving...' : 'Save'}</button>
      </div>
    </form>
  );
}
