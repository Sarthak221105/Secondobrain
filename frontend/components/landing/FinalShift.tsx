import { motion } from 'framer-motion';

/**
 * Section 6 — "From tools to systems"
 *
 * Closing section with final CTA. Sharp, short, category-defining close.
 */
export default function FinalShift() {
  return (
    <section id="final" className="relative py-28 bg-cream-50 border-b border-black/5">
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-14"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ink-600 font-mono">
            The shift
          </p>
          <h2 className="mt-4 font-serif text-4xl sm:text-6xl text-ink-950 leading-[1.02] tracking-tight">
            From tools{' '}
            <span className="italic text-rust">to systems.</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid lg:grid-cols-2 gap-14 items-center"
        >
          {/* Left — the argument */}
          <div className="space-y-6 max-w-lg">
            <p className="text-ink-700 leading-relaxed">
              There are tools for:
            </p>
            <ul className="space-y-2.5 pl-1">
              {[
                'storing data',
                'searching knowledge',
                'building agents',
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-ink-700 leading-relaxed"
                >
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-ink-600/50 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="font-serif text-xl text-ink-950 leading-tight">
              But nothing that makes a company operable.
            </p>
            <div className="border-t border-black/10 pt-5">
              <p className="text-ink-700 text-lg leading-relaxed">
                SecondoBrain is that layer.
              </p>
            </div>
          </div>

          {/* Right — closing CTA card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative rounded-2xl bg-white border border-black/10 p-6 sm:p-8 shadow-[0_18px_60px_-20px_rgba(26,26,24,0.18)]"
          >
            <p className="font-serif text-2xl sm:text-3xl text-ink-950 leading-tight">
              If AI is going to run your company,
              <br />
              your company needs a{' '}
              <span className="italic text-rust">brain</span>.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href="#waitlist"
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-ink-950 text-white px-7 py-3.5 text-[15px] font-medium hover:bg-ink-800 transition-colors"
              >
                Book a Demo
                <span aria-hidden>→</span>
              </a>
              <a
                href="/search"
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-black/15 text-ink-950 px-7 py-3.5 text-[15px] font-medium hover:bg-cream-100 transition-colors"
              >
                Try the demo
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
