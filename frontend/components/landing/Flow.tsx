import { motion } from 'framer-motion';

const STEPS = [
  {
    label: 'Query',
    caption: 'Natural-language question from any employee.',
  },
  {
    label: 'Hybrid retrieval',
    caption: 'Pinecone semantic + Elasticsearch keyword — merged via RRF.',
  },
  {
    label: 'Permission filter',
    caption: 'Strip any result the caller is not authorized to see.',
  },
  {
    label: 'Streaming answer',
    caption: 'Gemini produces a cited answer, streamed token-by-token.',
  },
];

/** Cream-theme 4-step pipeline with self-drawing arrows between pills. */
export default function Flow() {
  return (
    <section id="how" className="relative py-28 bg-cream-100">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-14"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ink-600 font-mono">
            Under the hood
          </p>
          <h2 className="mt-4 font-serif text-3xl sm:text-5xl text-ink-950 leading-[1.05] tracking-tight">
            Four steps from question{' '}
            <span className="italic text-rust">to cited answer.</span>
          </h2>
          <p className="mt-5 text-ink-700 max-w-xl">
            Every query runs through the same pipeline — no shortcuts, no
            permission bypasses, no unindexed caches.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-4 relative">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="relative"
            >
              <div className="relative rounded-2xl bg-white border border-black/10 p-5 shadow-[0_1px_0_rgba(0,0,0,0.04)] hover:border-rust/40 hover:shadow-[0_14px_40px_-18px_rgba(194,85,59,0.2)] transition-all">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-ink-950 text-white text-sm font-semibold font-mono">
                    {i + 1}
                  </span>
                  <h3 className="font-serif text-lg text-ink-950">{step.label}</h3>
                </div>
                <p className="mt-3 text-sm text-ink-700 leading-relaxed">
                  {step.caption}
                </p>
              </div>

              {i < STEPS.length - 1 && (
                <svg
                  className="hidden md:block absolute top-10 -right-4 z-10 h-6 w-6 text-ink-600/40"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <motion.path
                    d="M4 12 L20 12 M14 6 L20 12 L14 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    whileInView={{ pathLength: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 + i * 0.12 }}
                  />
                </svg>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
