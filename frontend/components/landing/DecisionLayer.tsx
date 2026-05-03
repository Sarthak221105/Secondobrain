import { motion } from 'framer-motion';

/**
 * Section 5 — "The Decision Layer"
 *
 * Core differentiator. Explains the decision-routing layer that makes
 * AI agents safe to run in real companies.
 */

const CORE_FUNCTIONS = [
  { label: 'Decision routing', desc: 'act / escalate / pause' },
  { label: 'Exception handling', desc: 'learn from past edge cases' },
  { label: 'Confidence scoring', desc: 'no blind execution' },
  { label: 'Human-in-loop', desc: 'boundaries where humans stay in control' },
  { label: 'Decision memory', desc: 'system improves over time' },
];

export default function DecisionLayer() {
  return (
    <section id="decision-layer" className="relative py-28 bg-cream-100">
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-14"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ink-600 font-mono">
            Core differentiator
          </p>
          <h2 className="mt-4 font-serif text-4xl sm:text-6xl text-ink-950 leading-[1.02] tracking-tight">
            The Decision{' '}
            <span className="italic text-rust">Layer.</span>
          </h2>
          <p className="mt-5 text-ink-700 text-lg leading-relaxed max-w-xl">
            Because execution without judgment breaks.
          </p>
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
            <p className="text-ink-700 leading-relaxed">
              AI agents don't fail on known paths.
            </p>
            <p className="font-serif text-xl text-ink-950 leading-tight">
              They fail on edge cases.
            </p>
            <div className="border-t border-black/10 pt-5 space-y-4">
              <p className="text-ink-700 leading-relaxed">
                The Decision Layer determines:
              </p>
              <p className="font-serif text-lg text-ink-950 italic leading-snug">
                "What should happen next — in this company — in this situation?"
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-ink-700 leading-relaxed">
                It ensures:
              </p>
              <ul className="space-y-2.5 pl-1">
                {[
                  'agents don\u2019t guess',
                  'actions happen only with sufficient context',
                  'humans stay in control where needed',
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
          </div>

          {/* Right — core functions */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.07 } },
            }}
            className="space-y-3"
          >
            {CORE_FUNCTIONS.map((fn) => (
              <motion.div
                key={fn.label}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  show: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.4 }}
                whileHover={{ y: -2 }}
                className="group rounded-2xl bg-white border border-black/10 p-5 shadow-[0_1px_0_rgba(0,0,0,0.04)] hover:border-rust/40 hover:shadow-[0_14px_40px_-18px_rgba(194,85,59,0.2)] transition-all"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg text-ink-950">
                    {fn.label}
                  </h3>
                  <span
                    aria-hidden
                    className="h-2 w-2 rounded-full bg-rust/70 group-hover:bg-rust transition-colors"
                  />
                </div>
                <p className="mt-1.5 text-sm text-ink-700 leading-relaxed">
                  {fn.desc}
                </p>
              </motion.div>
            ))}

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="pt-4 font-serif text-xl text-ink-950 italic leading-snug"
            >
              This is what makes AI usable in real companies.
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
