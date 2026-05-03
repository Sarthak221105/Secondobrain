import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { joinWaitlist } from '../../lib/api';
import DashboardMockup from './DashboardMockup';

/**
 * The hero: Secondo-Brain-style editorial layout.
 *
 *   • Left column  — pill badge → oversized serif headline with italic
 *                    rust accent → subhead → inline email form →
 *                    trust line → stats strip.
 *   • Right column — product dashboard preview (DashboardMockup).
 */
export default function Hero() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please enter your work email.');
      return;
    }
    setBusy(true);
    try {
      // The backend requires `name` — derive it from the email local-part so
      // the hero form stays short. The dedicated waitlist section asks for more.
      await joinWaitlist({
        name: trimmed.split('@')[0] || 'anonymous',
        email: trimmed,
      });
      setDone(true);
      setEmail('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="relative isolate overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-14 items-start">
        {/* LEFT COLUMN */}
        <div>
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/50 backdrop-blur px-3.5 py-1.5 text-xs text-ink-800"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-rust" />
            The Company Brain — now in private beta
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-6 font-serif text-ink-950 leading-[1.02] tracking-tight text-5xl sm:text-6xl lg:text-[4.5rem]"
          >
            AI can't run your company.
            <br />
            <span className="italic text-rust">Your company isn't built for AI.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 text-ink-700 text-lg leading-relaxed max-w-lg"
          >
            SecondoBrain builds the Company Brain — the system that structures
            knowledge, decisions, and workflows so AI can operate reliably.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.28 }}
            className="mt-4 text-ink-600 text-sm leading-relaxed max-w-lg"
          >
            Not a chatbot. Not automation. The missing layer between your
            company and AI execution.
          </motion.p>

          <motion.form
            onSubmit={submit}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mt-8 flex flex-col sm:flex-row gap-3 max-w-lg"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              aria-label="Work email"
              className="flex-1 rounded-full bg-white/80 backdrop-blur border border-black/10 px-5 py-3.5 text-[15px] text-ink-900 placeholder-ink-600/60 focus:border-rust focus:outline-none focus:ring-2 focus:ring-rust/20 transition-colors"
            />
            <button
              type="submit"
              disabled={busy || done}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-ink-950 text-white px-6 py-3.5 text-[15px] font-medium hover:bg-ink-800 transition-colors disabled:opacity-60"
            >
              {done ? "You're on the list ✓" : busy ? 'Submitting…' : 'Book a Demo'}
            </button>
          </motion.form>

          {error && (
            <p className="mt-3 text-sm text-rust-dark max-w-lg">{error}</p>
          )}
          {!error && (
            <p className="mt-4 text-sm text-ink-600 max-w-lg">
              Join a quiet list of founders and operators · No spam, one email at launch.
            </p>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative lg:mt-4"
        >
          <DashboardMockup />
        </motion.div>
      </div>

      {/* STATS STRIP */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="relative max-w-7xl mx-auto px-5 sm:px-8 mt-20 grid grid-cols-2 sm:grid-cols-4 gap-0 border-y border-black/10 divide-x divide-black/10"
      >
        <Stat big="1" label="system layer" caption="The Company Brain — one infrastructure" />
        <Stat big="∞" label="knowledge sources" caption="Docs · Slack · Email · Meetings" />
        <Stat big="0" label="blind executions" caption="Decision Layer ensures context first" />
        <Stat big="100%" label="human control" caption="Escalate · Pause · Override — always" />
      </motion.div>
    </section>
  );
}

function Stat({
  big,
  label,
  caption,
}: {
  big: string;
  label: string;
  caption: string;
}) {
  return (
    <div className="p-6">
      <div className="font-serif text-4xl sm:text-5xl text-ink-950 leading-none">
        {big}
      </div>
      <div className="mt-2 text-[11px] uppercase tracking-[0.2em] text-ink-600">
        {label}
      </div>
      <div className="mt-2 text-xs text-ink-700 leading-relaxed">
        {caption}
      </div>
    </div>
  );
}
