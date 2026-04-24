import Link from 'next/link';
import { motion } from 'framer-motion';

/**
 * Closing banner — one sentence, one button. Slight animated sheen on the
 * CTA button for a bit of polish without being tacky.
 */
export default function FinalCTA() {
  return (
    <section className="relative isolate overflow-hidden py-28 bg-gray-950 text-white">
      {/* Soft radial spotlight */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.25),transparent_60%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-20 [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:40px_40px]"
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7 }}
        className="max-w-3xl mx-auto px-6 text-center"
      >
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
          Ready to search like an{' '}
          <span className="bg-gradient-to-r from-sky-300 to-indigo-300 bg-clip-text text-transparent">
            insider
          </span>
          ?
        </h2>
        <p className="mt-4 text-gray-300 text-base sm:text-lg">
          Jump straight into the interactive demo. No signup, no SSO — pick
          a role in the header and go.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/search"
            className="group relative overflow-hidden rounded-full bg-white text-gray-900 px-7 py-3.5 text-sm font-semibold shadow-xl hover:shadow-brand/40 transition-shadow"
          >
            <span className="relative z-10">Launch the demo →</span>
            <span
              aria-hidden
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-brand/30 to-transparent group-hover:translate-x-full transition-transform duration-700"
            />
          </Link>
          <Link
            href="/admin"
            className="rounded-full border border-white/20 text-white px-7 py-3.5 text-sm font-semibold hover:bg-white/10 transition-colors"
          >
            Upload as admin
          </Link>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          Testing phase · your data stays local while auth is disabled.
        </p>
      </motion.div>
    </section>
  );
}
