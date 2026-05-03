import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
    <main className="relative min-h-screen bg-cream-50 text-ink-900">
      {/* Faint editorial grid + soft rust glow, mirrors the landing page. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-grid-ink [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_75%)] opacity-60"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -top-40 right-[-10%] -z-10 h-[480px] w-[480px] rounded-full bg-rust/15 blur-3xl animate-aurora"
      />

      <header className="sticky top-0 z-40 border-b border-black/5 bg-cream-50/85 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-5 sm:px-8 py-4 gap-3 flex-wrap">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-ink-950 shrink-0">
              <span className="w-2 h-2 rounded-full bg-rust" />
            </span>
            <span className="font-serif text-xl text-ink-950 tracking-tight">
              Secondo<span className="italic text-rust"> Brain</span>
            </span>
          </Link>

          <div className="flex items-center gap-3 text-sm">
            {userEmail && (
              <span className="text-ink-700 hidden sm:inline">{userEmail}</span>
            )}
            {role && (
              <span className="rounded-full border border-black/10 bg-white/80 backdrop-blur px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-[0.2em] text-ink-700">
                {role}
              </span>
            )}
            {role === 'admin' && (
              <a
                href="/admin"
                className="text-rust font-medium hover:text-rust-dark transition-colors"
              >
                Admin
              </a>
            )}
            <RoleSwitcher />
          </div>
        </div>
        {!isAuthEnabled() && (
          <div className="border-t border-black/5 bg-rust/5 px-4 py-1.5 text-[11px] font-mono uppercase tracking-[0.18em] text-rust-dark text-center">
            Dev mode — switch roles from the dropdown
          </div>
        )}
      </header>

      <div className="relative max-w-3xl mx-auto px-5 sm:px-8 py-10 space-y-7">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ink-600 font-mono">
            {role ? `Signed in as ${role}` : 'Workspace'}
          </p>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl text-ink-950 leading-[1.05] tracking-tight">
            Ask your company.{' '}
            <span className="italic text-rust">Get a cited answer.</span>
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <SearchBar
            onSearch={handleSearch}
            busy={busy}
            externalValue={searchInput}
          />
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-rust/40 bg-rust/5 px-4 py-2.5 text-sm text-rust-dark"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {(answer || streaming) && query && (
            <motion.div
              key="answer"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <AISummary answer={answer} streaming={streaming && !answer} />
            </motion.div>
          )}
        </AnimatePresence>

        {tookMs !== null && (
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-600">
            {results.length} result{results.length === 1 ? '' : 's'} · {tookMs} ms
          </p>
        )}

        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.05 } },
          }}
          className="space-y-3"
        >
          {results.map((r) => (
            <motion.div
              key={r.chunk_id}
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.4 }}
            >
              <ResultCard result={r} />
            </motion.div>
          ))}
        </motion.div>

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
