import { useEffect, useState } from 'react';
import { fetchWaitlistEntries, type WaitlistEntry } from '../lib/api';

/**
 * Admin panel: lists every waitlist signup newest-first, with a live
 * counter at the top. Shown on /admin below the audit log.
 */
export default function WaitlistAdmin() {
  const [rows, setRows] = useState<WaitlistEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWaitlistEntries();
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="font-semibold text-gray-900">Waitlist</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {loading
              ? 'Loading signups…'
              : `${rows.length} signup${rows.length === 1 ? '' : 's'} total`}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="rounded bg-gray-800 px-3 py-1.5 text-white text-sm disabled:opacity-60"
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2 pr-3">When</th>
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Email</th>
              <th className="py-2 pr-3">Company</th>
              <th className="py-2 pr-3">Role</th>
              <th className="py-2 pr-3">Use case</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id ?? `${r.email}-${i}`} className="border-b last:border-0 align-top">
                <td className="py-2 pr-3 text-gray-600 whitespace-nowrap">
                  {r.created_at
                    ? new Date(r.created_at).toLocaleString()
                    : '—'}
                </td>
                <td className="py-2 pr-3 text-gray-900">{r.name}</td>
                <td className="py-2 pr-3 text-gray-700">{r.email}</td>
                <td className="py-2 pr-3 text-gray-700">{r.company || '—'}</td>
                <td className="py-2 pr-3 text-gray-700">{r.role || '—'}</td>
                <td className="py-2 pr-3 text-gray-600">
                  <span className="line-clamp-2 max-w-sm" title={r.use_case || ''}>
                    {r.use_case || '—'}
                  </span>
                </td>
              </tr>
            ))}
            {!rows.length && !loading && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-500">
                  Nobody has signed up yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
