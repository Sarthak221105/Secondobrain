import { motion } from 'framer-motion';

/**
 * Section 3 — "The Company Brain"
 *
 * Compressed solution section. Replaces the old HowItWorks + Flow
 * with a single dense block that explains what SecondoBrain does.
 */

const CAPABILITIES = [
  'extracts knowledge from across your company',
  'structures it into workflows, rules, and decisions',
  'keeps it continuously updated',
  'converts it into executable intelligence',
];

export default function TheSystem() {
  return (
    <section id="system" className="relative py-28 bg-cream-100">
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-14"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ink-600 font-mono">
            The system
          </p>
          <h2 className="mt-4 font-serif text-4xl sm:text-6xl text-ink-950 leading-[1.02] tracking-tight">
            The Company{' '}
            <span className="italic text-rust">Brain.</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid lg:grid-cols-2 gap-14 items-center"
        >
          {/* Left — narrative */}
          <div className="space-y-6 max-w-lg">
            <p className="text-ink-700 text-lg leading-relaxed">
              SecondoBrain turns your company into a system AI can understand.
            </p>
            <p className="text-ink-700 leading-relaxed">
              It:
            </p>
            <ul className="space-y-3">
              {CAPABILITIES.map((cap, i) => (
                <motion.li
                  key={cap}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
                  className="flex items-start gap-3 text-ink-700 leading-relaxed"
                >
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-ink-950 text-white text-[10px] font-mono font-semibold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {cap}
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Right — punchline card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="relative rounded-2xl bg-white border border-black/10 p-6 sm:p-8 shadow-[0_8px_40px_-12px_rgba(26,26,24,0.12)]"
          >
            <div className="flex items-center gap-3 mb-5">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-rust text-white">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-ink-600">
                Infrastructure layer
              </span>
            </div>
            <p className="font-serif text-2xl sm:text-3xl text-ink-950 leading-tight">
              This becomes the layer AI actually runs on.
            </p>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {['Knowledge extraction', 'Workflow mapping', 'Decision logic', 'Continuous sync'].map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border border-black/10 bg-cream-50/70 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-ink-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
