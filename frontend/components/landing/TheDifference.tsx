import { motion } from 'framer-motion';

/**
 * Section 4 — "This is not automation"
 *
 * Kills wrong mental models. Short, sharp differentiation block.
 */
export default function TheDifference() {
  return (
    <section id="difference" className="relative py-28 bg-cream-50">
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-14"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ink-600 font-mono">
            The difference
          </p>
          <h2 className="mt-4 font-serif text-4xl sm:text-6xl text-ink-950 leading-[1.02] tracking-tight">
            This is not{' '}
            <span className="italic text-rust">automation.</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid lg:grid-cols-2 gap-14 items-start"
        >
          {/* Left — the argument */}
          <div className="space-y-6 max-w-lg">
            <p className="text-ink-700 text-lg leading-relaxed">
              Automation follows fixed rules.
            </p>
            <p className="font-serif text-xl text-ink-950 leading-tight">
              Companies don't.
            </p>
            <p className="text-ink-700 leading-relaxed">
              They run on:
            </p>
            <ul className="space-y-2.5 pl-1">
              {['context', 'exceptions', 'evolving decisions'].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-ink-700 leading-relaxed"
                >
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-rust shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Right — punchline card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative rounded-2xl bg-white border border-black/10 p-6 sm:p-8 shadow-[0_8px_40px_-12px_rgba(26,26,24,0.12)]"
          >
            <div className="space-y-5">
              <p className="text-ink-700 leading-relaxed">
                SecondoBrain doesn't automate tasks.
              </p>
              <p className="font-serif text-2xl sm:text-3xl text-ink-950 leading-tight">
                It makes your company's logic{' '}
                <span className="text-rust">computable</span>.
              </p>
              <div className="border-t border-black/10 pt-5">
                <p className="text-ink-700 leading-relaxed">
                  That's what allows AI to operate safely.
                </p>
              </div>
            </div>

            {/* Visual contrast strip */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-black/10 bg-cream-50/60 p-3">
                <p className="text-[10px] font-mono uppercase tracking-widest text-ink-600 mb-2">
                  ✕ Automation
                </p>
                <p className="text-xs text-ink-700">
                  Fixed rules. Breaks on exceptions.
                </p>
              </div>
              <div className="rounded-xl border border-rust/25 bg-rust/5 p-3">
                <p className="text-[10px] font-mono uppercase tracking-widest text-rust mb-2">
                  ✓ Company Brain
                </p>
                <p className="text-xs text-ink-700">
                  Adaptive logic. Learns from decisions.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
