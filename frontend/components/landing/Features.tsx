import { motion } from 'framer-motion';

type Feature = { title: string; body: string; icon: JSX.Element };

const ICON = {
  className: 'w-6 h-6',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
  stroke: 'currentColor',
  viewBox: '0 0 24 24',
};

const FEATURES: Feature[] = [
  {
    title: 'Hybrid retrieval',
    body: 'Semantic vectors + keyword relevance, merged with Reciprocal Rank Fusion. Best of both worlds, zero config.',
    icon: (
      <svg {...ICON}>
        <circle cx="10" cy="10" r="6" />
        <path d="M14.5 14.5L20 20" />
        <path d="M7 10h6" />
      </svg>
    ),
  },
  {
    title: 'Role-aware by default',
    body: 'Every result list passes through the permission filter before leaving the backend. Admin bypass is explicit, never implicit.',
    icon: (
      <svg {...ICON}>
        <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'DLP-ready ingestion',
    body: 'Cloud DLP scans every chunk before indexing. PII, keys, and card numbers are redacted — fail-closed if the scanner is unreachable.',
    icon: (
      <svg {...ICON}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 9h18" />
        <path d="M8 14h4" />
      </svg>
    ),
  },
  {
    title: 'Streaming RAG',
    body: 'Top 3 permission-filtered results → Gemini → cited, grounded answer, streamed token-by-token as NDJSON.',
    icon: (
      <svg {...ICON}>
        <path d="M12 3v3" />
        <path d="M5.6 5.6l2.1 2.1" />
        <path d="M18.4 5.6l-2.1 2.1" />
        <path d="M3 12h3" />
        <path d="M18 12h3" />
        <path d="M12 18a6 6 0 100-12 6 6 0 000 12z" />
      </svg>
    ),
  },
  {
    title: 'Upload anything',
    body: 'PDF, DOCX, TXT, MD — chunked, embedded, and indexed from the admin console. Per-file ACL chosen at upload time.',
    icon: (
      <svg {...ICON}>
        <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" />
        <path d="M14 3v5h5" />
        <path d="M12 18v-6" />
        <path d="M9 15l3-3 3 3" />
      </svg>
    ),
  },
  {
    title: 'Full audit trail',
    body: 'Every search — user, query, result count, IP — written before the response returns. Firestore in prod, in-memory in dev.',
    icon: (
      <svg {...ICON}>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M8 9h8" />
        <path d="M8 13h8" />
        <path d="M8 17h5" />
      </svg>
    ),
  },
];

/** Cream-theme feature grid. */
export default function Features() {
  return (
    <section id="features" className="relative py-28 bg-cream-100">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-16"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ink-600 font-mono">
            Built for trust
          </p>
          <h2 className="mt-4 font-serif text-3xl sm:text-5xl text-ink-950 leading-[1.05] tracking-tight">
            Enterprise-grade plumbing,{' '}
            <span className="italic text-rust">consumer-grade UX.</span>
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.07 } },
          }}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {FEATURES.map((f) => (
            <motion.div
              key={f.title}
              variants={{
                hidden: { opacity: 0, y: 24 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -4 }}
              className="group rounded-2xl bg-white border border-black/10 p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)] hover:border-rust/40 hover:shadow-[0_14px_40px_-18px_rgba(194,85,59,0.2)] transition-all"
            >
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-rust/10 text-rust group-hover:bg-rust group-hover:text-white transition-colors">
                {f.icon}
              </div>
              <h3 className="mt-5 font-serif text-xl text-ink-950">
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-ink-700 leading-relaxed">
                {f.body}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
