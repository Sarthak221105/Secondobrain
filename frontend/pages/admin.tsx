import { useEffect, useState } from 'react';
import DocumentUpload from '../components/DocumentUpload';
import RoleSwitcher from '../components/RoleSwitcher';
import WaitlistAdmin from '../components/WaitlistAdmin';
import { assignRole, fetchAudit, fetchMe } from '../lib/api';
import { isAuthEnabled, ROLES } from '../lib/role';

type AuditRow = {
  user_id: string;
  user_email: string;
  query: string;
  result_count: number;
  timestamp: string;
  ip_address?: string | null;
};

export default function AdminPage() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'denied' | 'error'>(
    'loading',
  );
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [filterUser, setFilterUser] = useState('');

  const [targetUid, setTargetUid] = useState('');
  const [newRole, setNewRole] = useState('engineering');
  const [assignMsg, setAssignMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await fetchMe();
        if (me.role !== 'admin') {
          setStatus('denied');
          return;
        }
        setStatus('ok');
      } catch (e) {
        setStatus('error');
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, []);

  async function load() {
    try {
      const data = await fetchAudit(filterUser || undefined, 1000);
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  useEffect(() => {
    if (status === 'ok') void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function handleAssign() {
    setAssignMsg(null);
    try {
      await assignRole(targetUid.trim(), newRole);
      setAssignMsg(`Assigned ${newRole} to ${targetUid}`);
      setTargetUid('');
    } catch (e) {
      setAssignMsg(e instanceof Error ? e.message : String(e));
    }
  }

  if (status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Checking permissions…</p>
      </main>
    );
  }

  if (status === 'denied') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-lg font-semibold text-gray-900">Admin only</h1>
        <p className="text-sm text-gray-600 max-w-md">
          This page is restricted to users with the <code>admin</code> role.
          {!isAuthEnabled() &&
            ' Switch to admin via the dropdown in the header of the home page.'}
        </p>
        <div className="flex gap-3 items-center">
          <a href="/search" className="text-brand hover:underline text-sm">
            Back to search
          </a>
          <RoleSwitcher />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-5xl mx-auto p-6 space-y-8">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-semibold text-gray-900">Admin</h1>
        <div className="flex items-center gap-3 text-sm">
          <a href="/search" className="text-brand hover:underline">
            Back to search
          </a>
          <RoleSwitcher />
        </div>
      </header>

      {!isAuthEnabled() && (
        <div className="rounded border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          Dev mode — Firebase auth is disabled.
        </div>
      )}

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <DocumentUpload />

      <WaitlistAdmin />

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">Assign role</h2>
        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <input
            value={targetUid}
            onChange={(e) => setTargetUid(e.target.value)}
            placeholder="Firebase UID"
            className="flex-1 min-w-0 rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button
            onClick={handleAssign}
            disabled={!targetUid}
            className="rounded bg-brand px-4 py-2 text-white text-sm disabled:opacity-50"
          >
            Assign
          </button>
        </div>
        {!isAuthEnabled() && (
          <p className="mt-2 text-xs text-gray-500">
            Role assignment calls the Firebase Admin SDK and will fail while
            auth is disabled — it will work once Firebase is re-enabled.
          </p>
        )}
        {assignMsg && <p className="mt-2 text-sm text-gray-600">{assignMsg}</p>}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-gray-900">Audit log</h2>
          <input
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            placeholder="filter by user_id"
            className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm"
          />
          <button
            onClick={load}
            className="rounded bg-gray-800 px-3 py-1.5 text-white text-sm"
          >
            Refresh
          </button>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 pr-3">Time</th>
                <th className="py-2 pr-3">User</th>
                <th className="py-2 pr-3">Query</th>
                <th className="py-2 pr-3">Results</th>
                <th className="py-2 pr-3">IP</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2 pr-3 text-gray-600">{r.timestamp}</td>
                  <td className="py-2 pr-3 text-gray-900">{r.user_email}</td>
                  <td className="py-2 pr-3">{r.query}</td>
                  <td className="py-2 pr-3">{r.result_count}</td>
                  <td className="py-2 pr-3 text-gray-500">{r.ip_address ?? '—'}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">
                    No audit entries.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
