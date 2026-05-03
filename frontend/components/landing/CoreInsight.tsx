import { motion } from 'framer-motion';

/**
 * Section 2 — "The real problem isn't AI"
 *
 * Replaces the old UseCases grid with a single, dense insight block.
 * Same cream palette and motion conventions as the rest of the landing page.
 */
export default function CoreInsight() {
  return (
    <section id="insight" className="relative py-28 bg-cream-50">
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-14"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ink-600 font-mono">
            Core insight
          </p>
          <h2 className="mt-4 font-serif text-4xl sm:text-6xl text-ink-950 leading-[1.02] tracking-tight">
            The real problem{' '}
            <span className="italic text-rust">isn't AI.</span>
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
              Models are already good.
            </p>
            <p className="text-ink-700 text-lg leading-relaxed">
              What's broken is how companies are structured.
            </p>
            <p className="text-ink-700 leading-relaxed">
              Critical knowledge is:
            </p>
            <ul className="space-y-2.5 pl-1">
              {[
                'scattered across tools',
                'locked in people\u2019s heads',
                'constantly changing',
              ].map((item) => (
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

          {/* Right — the punchline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative rounded-2xl bg-white border border-black/10 p-6 sm:p-8 shadow-[0_8px_40px_-12px_rgba(26,26,24,0.12)]"
          >
            <div className="space-y-5">
              <p className="text-ink-700 leading-relaxed">
                Humans make this work.
              </p>
              <p className="font-serif text-xl sm:text-2xl text-ink-950 leading-tight">
                AI cannot.
              </p>
              <div className="border-t border-black/10 pt-5">
                <p className="text-ink-700 leading-relaxed">
                  So AI agents fail — not because they're weak,
                  but because your company is{' '}
                  <span className="text-rust font-medium">unreadable</span>.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
