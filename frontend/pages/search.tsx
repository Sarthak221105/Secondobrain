import { useEffect, useState } from 'react';
import Link from 'next/link';
import SearchBar from '../components/SearchBar';
import ResultCard from '../components/ResultCard';
import AISummary from '../components/AISummary';
import RoleSwitcher from '../components/RoleSwitcher';
import RoleHome from '../components/RoleHome';
import { fetchMe, streamSearch, SearchResult } from '../lib/api';
import { getCurrentRole, isAuthEnabled, type Role } from '../lib/role';

export default function SearchPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [answer, setAnswer] = useState('');
  const [query, setQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tookMs, setTookMs] = useState<number | null>(null);

  useEffect(() => {
    // Optimistically show role-appropriate content based on whatever the
    // RoleSwitcher has in localStorage, so the landing view renders even
    // before /auth/me comes back (or when the backend is unreachable).
    if (!isAuthEnabled()) {
      setRole(getCurrentRole());
    }

    (async () => {
      try {
        const me = await fetchMe();
        setUserEmail(me.email);
        setRole(me.role);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, []);

  async function handleSearch(q: string) {
    setBusy(true);
    setStreaming(true);
    setError(null);
    setResults([]);
    setAnswer('');
    setQuery(q);
    setTookMs(null);
    try {
      for await (const event of streamSearch(q)) {
        if (event.type === 'results') {
          setResults(event.results);
          setTookMs(event.took_ms);
          setBusy(false);
        } else if (event.type === 'token') {
          setAnswer((a) => a + event.text);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      setStreaming(false);
    }
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto flex items-center justify-between p-4 gap-3 flex-wrap">
          <Link
            href="/"
            className="text-lg font-semibold text-gray-900 hover:text-brand transition-colors"
          >
            Secondo Brain
          </Link>
          <div className="flex items-center gap-3 text-sm">
            {userEmail && (
              <span className="text-gray-600 hidden sm:inline">{userEmail}</span>
            )}
            {role && (
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs uppercase text-gray-700">
                {role}
              </span>
            )}
            {role === 'admin' && (
              <a href="/admin" className="text-brand hover:underline">
                Admin
              </a>
            )}
            <RoleSwitcher />
          </div>
        </div>
        {!isAuthEnabled() && (
          <div className="bg-amber-50 border-t border-amber-200 px-4 py-1.5 text-xs text-amber-800 text-center">
            Dev mode — Firebase auth is disabled. Switch roles from the
            dropdown above.
          </div>
        )}
      </header>

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <SearchBar
          onSearch={handleSearch}
          busy={busy}
          externalValue={searchInput}
        />

        {error && (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {(answer || streaming) && query && (
          <AISummary answer={answer} streaming={streaming && !answer} />
        )}

        {tookMs !== null && (
          <p className="text-xs text-gray-500">
            {results.length} result{results.length === 1 ? '' : 's'} · {tookMs} ms
          </p>
        )}

        <div className="space-y-3">
          {results.map((r) => (
            <ResultCard key={r.chunk_id} result={r} />
          ))}
        </div>

        {!query && !busy && (
          <RoleHome
            role={(role as Role | null) ?? null}
            onPickQuery={(q) => {
              setSearchInput(q);
              handleSearch(q);
            }}
          />
        )}
      </div>
    </main>
  );
}
