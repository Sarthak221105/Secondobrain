import { useRef, useState } from 'react';
import { uploadDocuments, type UploadResult } from '../lib/api';
import { ROLES, type Role } from '../lib/role';

// Default: every non-admin role can see new uploads. Admin is always included
// server-side so admins can read back what they upload even if they uncheck
// every box here.
const DEFAULT_SELECTED: Role[] = ROLES.filter((r) => r !== 'admin');

/**
 * Admin-only panel that lets the operator pick one or more PDF / DOCX / TXT /
 * MD files and index them into the vector DB with a chosen ACL.
 *
 * The component is fully self-contained — no props — and is mounted on the
 * `/admin` page. Non-admin users never see this because the admin page gates
 * itself on role.
 */
export default function DocumentUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [selected, setSelected] = useState<Set<Role>>(new Set(DEFAULT_SELECTED));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<UploadResult[] | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function toggleRole(r: Role) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(r)) next.delete(r);
      else next.add(r);
      return next;
    });
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(e.target.files ?? []));
    setResults(null);
    setError(null);
  }

  async function submit() {
    if (!files.length) {
      setError('Pick at least one file.');
      return;
    }
    if (selected.size === 0) {
      setError('Pick at least one role that can see these documents.');
      return;
    }
    setBusy(true);
    setError(null);
    setResults(null);
    try {
      const { uploaded } = await uploadDocuments(files, Array.from(selected));
      setResults(uploaded);
      setFiles([]);
      if (fileInput.current) fileInput.current.value = '';
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const totalBytes = files.reduce((n, f) => n + f.size, 0);

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Upload documents</h2>
        <span className="text-xs text-gray-500">
          PDF · DOCX · TXT · MD · 25 MB max per file
        </span>
      </div>

      <div className="mt-3 space-y-3">
        <div>
          <input
            ref={fileInput}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.md,.log,.csv"
            onChange={onPick}
            disabled={busy}
            className="block w-full text-sm text-gray-700 file:mr-3 file:rounded file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-white file:cursor-pointer file:hover:bg-brand-dark disabled:opacity-50"
          />
          {files.length > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              {files.length} file{files.length === 1 ? '' : 's'} selected ·{' '}
              {(totalBytes / 1024).toFixed(1)} KB total
            </p>
          )}
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-1.5">
            Visible to
          </p>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => {
              const isAdmin = r === 'admin';
              const checked = selected.has(r) || isAdmin;
              return (
                <label
                  key={r}
                  className={`flex items-center gap-1.5 rounded border px-2 py-1 text-sm cursor-pointer ${
                    checked
                      ? 'border-brand bg-brand/5 text-gray-900'
                      : 'border-gray-300 bg-white text-gray-700'
                  } ${isAdmin ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={isAdmin || busy}
                    onChange={() => toggleRole(r)}
                    className="accent-brand"
                  />
                  {r}
                </label>
              );
            })}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            <code>admin</code> is always included.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={submit}
            disabled={busy || !files.length}
            className="rounded bg-brand px-4 py-2 text-white text-sm font-medium disabled:opacity-50"
          >
            {busy
              ? 'Uploading…'
              : `Upload ${files.length || ''} ${
                  files.length === 1 ? 'file' : 'files'
                }`}
          </button>
          {busy && (
            <span className="text-xs text-gray-500">
              Parsing, chunking, embedding — this can take a few seconds per file.
            </span>
          )}
        </div>

        {error && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {results && (
          <ul className="divide-y divide-gray-100 rounded border border-gray-200 bg-gray-50">
            {results.map((r, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
              >
                <span className="truncate font-medium text-gray-800">
                  {r.filename}
                </span>
                <span className="flex items-center gap-2 text-xs shrink-0">
                  {r.status === 'indexed' && (
                    <span className="rounded bg-green-100 text-green-800 px-2 py-0.5">
                      indexed · {r.chunks} chunk{r.chunks === 1 ? '' : 's'}
                    </span>
                  )}
                  {r.status === 'skipped' && (
                    <span
                      className="rounded bg-amber-100 text-amber-800 px-2 py-0.5"
                      title={r.reason}
                    >
                      skipped{r.reason ? ` — ${r.reason}` : ''}
                    </span>
                  )}
                  {r.status === 'error' && (
                    <span
                      className="rounded bg-red-100 text-red-800 px-2 py-0.5"
                      title={r.reason}
                    >
                      error{r.reason ? ` — ${r.reason}` : ''}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
