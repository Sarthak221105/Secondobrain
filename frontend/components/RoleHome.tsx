import { motion } from 'framer-motion';
import type { Role } from '../lib/role';
import { contentFor } from '../lib/roleContent';

type Props = {
  role: Role | null;
  onPickQuery: (q: string) => void;
};

const ROLE_ACCENT: Record<Role, string> = {
  engineering: 'from-sky-500 to-blue-600',
  hr: 'from-emerald-500 to-teal-600',
  sales: 'from-amber-500 to-orange-600',
  finance: 'from-lime-500 to-green-600',
  executive: 'from-violet-500 to-purple-600',
  admin: 'from-rose-500 to-red-600',
};

/**
 * The "landing" panel shown on the search page when the user has not yet
 * searched. Editorial cream/ink/rust treatment matched to the marketing
 * landing page. Content is driven by the caller's role.
 */
export default function RoleHome({ role, onPickQuery }: Props) {
  const c = contentFor(role);
  const isAdmin = role === 'admin';
  const accent = role ? ROLE_ACCENT[role] : ROLE_ACCENT.engineering;

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
      }}
      className="space-y-6"
    >
      <motion.section
        variants={{
          hidden: { opacity: 0, y: 18 },
          show: { opacity: 1, y: 0 },
        }}
        transition={{ duration: 0.5 }}
        className="group relative overflow-hidden rounded-2xl bg-white border border-black/10 p-7 shadow-[0_1px_0_rgba(0,0,0,0.04)] hover:shadow-[0_18px_50px_-22px_rgba(194,85,59,0.25)] transition-shadow"
      >
        <span
          aria-hidden
          className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${accent} opacity-80`}
        />
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ink-600 font-mono">
              {role ?? 'employee'}
            </p>
            <h2 className="mt-3 font-serif text-3xl sm:text-4xl text-ink-950 leading-[1.05] tracking-tight">
              {c.greeting}
            </h2>
            <p className="mt-3 text-ink-700 leading-relaxed">{c.blurb}</p>
          </div>
          <div className="hidden md:flex flex-col items-end gap-2 shrink-0">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink-600">
              You can search
            </span>
            <div className="flex flex-wrap justify-end gap-1.5 max-w-[16rem]">
              {c.sources.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center rounded-full border border-black/10 bg-cream-50/70 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-ink-700"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        variants={{
          hidden: { opacity: 0, y: 18 },
          show: { opacity: 1, y: 0 },
        }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ink-600 font-mono">
            Try asking
          </h3>
          <span className="text-[11px] text-ink-600 font-mono">
            Click to run
          </span>
        </div>
        <motion.div
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.05 } },
          }}
          className="grid gap-2.5 sm:grid-cols-2"
        >
          {c.suggestedQueries.map((q) => (
            <motion.button
              key={q}
              variants={{
                hidden: { opacity: 0, y: 10 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.35 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onPickQuery(q)}
              className="group relative text-left rounded-xl border border-black/10 bg-white px-4 py-3.5 text-sm text-ink-900 hover:border-rust/40 hover:shadow-[0_10px_30px_-16px_rgba(194,85,59,0.3)] transition-all"
            >
              <span className="text-rust mr-2 transition-transform inline-block group-hover:translate-x-0.5">
                ›
              </span>
              {q}
            </motion.button>
          ))}
        </motion.div>
      </motion.section>

      {isAdmin && (
        <motion.section
          variants={{
            hidden: { opacity: 0, y: 18 },
            show: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl border border-rust/30 bg-gradient-to-br from-cream-50 to-white p-5"
        >
          <span
            aria-hidden
            className="absolute -top-12 -right-10 h-32 w-32 rounded-full bg-rust/15 blur-2xl"
          />
          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div className="max-w-md">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-rust font-mono">
                Admin shortcuts
              </p>
              <h3 className="mt-2 font-serif text-xl text-ink-950">
                Manage the index
              </h3>
              <p className="mt-1 text-sm text-ink-700 leading-relaxed">
                Upload documents, assign roles, or review the audit log.
              </p>
            </div>
            <a
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-full bg-ink-950 text-white text-sm font-medium px-5 py-2.5 hover:bg-ink-800 transition-colors"
            >
              Open admin
              <span aria-hidden>→</span>
            </a>
          </div>
        </motion.section>
      )}
    </motion.div>
  );
}
