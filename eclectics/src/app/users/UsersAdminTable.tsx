"use client";
import { useEffect, useState, useTransition } from 'react';

interface UserRow { id: number; email: string; name: string | null; createdAt: string | null }

export default function UsersAdminTable() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string>('');

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/users');
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to load users');
        }
        const data = await res.json();
        if (active) setUsers(data);
      } catch (e: unknown) {
        if (active) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  function deleteUser(id: number) {
    if (!confirm('Delete this user? User must have no choreographies.')) return;
    setDeleteError('');
    startTransition(async () => {
      try {
        const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
        if (res.status === 204) {
          setUsers(prev => prev.filter(u => u.id !== id));
          return;
        }
        let msg = 'Delete failed';
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
        } catch {}
        setDeleteError(msg);
      } catch (e: unknown) {
        setDeleteError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <h1 className="text-2xl font-semibold mb-6">Manage Users</h1>
      {loading && <div className="text-sm text-gray-500">Loading users...</div>}
      {error && <div className="text-sm text-red-600 mb-4">{error}</div>}
      {!loading && !error && (
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">ID</th>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Created</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t">
                  <td className="px-3 py-2">{u.id}</td>
                  <td className="px-3 py-2">{u.name || <span className="italic text-gray-400">(none)</span>}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => deleteUser(u.id)}
                      disabled={pending}
                      className="text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-500">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {deleteError && <div className="mt-4 text-xs text-red-600">{deleteError}</div>}
    </div>
  );
}
