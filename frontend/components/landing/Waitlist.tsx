import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { joinWaitlist } from '../../lib/api';
import WaitlistCount from './WaitlistCount';

const ROLE_OPTIONS = [
  'Engineering',
  'Product',
  'Design',
  'Security / IT',
  'Sales / GTM',
  'People / HR',
  'Finance',
  'Executive',
  'Other',
];

type FormState = {
  name: string;
  email: string;
  company: string;
  role: string;
  use_case: string;
};

const EMPTY: FormState = {
  name: '',
  email: '',
  company: '',
  role: '',
  use_case: '',
};

/**
 * Cream-theme waitlist signup. POSTs to `/waitlist/join` which persists
 * to Firestore (when configured) or a local JSON file otherwise. A single
 * submit returns a success card that replaces the form.
 */
export default function Waitlist() {
  const [values, setValues] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!values.name.trim() || !values.email.trim()) {
      setError('Name and work email are required.');
      return;
    }
    setBusy(true);
    try {
      await joinWaitlist({
        name: values.name.trim(),
        email: values.email.trim(),
        company: values.company.trim() || undefined,
        role: values.role || undefined,
        use_case: values.use_case.trim() || undefined,
      });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      id="waitlist"
      className="relative isolate overflow-hidden py-28 bg-cream-100"
    >
      <div className="relative max-w-3xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 backdrop-blur px-3 py-1 text-xs font-medium text-ink-700">
            <span className="h-1.5 w-1.5 rounded-full bg-rust animate-pulse" />
            Private beta — limited spots
          </span>
          <h2 className="mt-6 font-serif text-4xl sm:text-6xl text-ink-950 leading-[1.02] tracking-tight">
            Join the{' '}
            <span className="italic text-rust">waitlist.</span>
          </h2>
          <p className="mt-5 text-ink-700 max-w-xl mx-auto">
            We're rolling out access company-by-company. Tell us about your
            team and we'll be in touch — usually within a few business days.
          </p>
          <WaitlistCount
            className="mt-6 text-xs font-medium text-ink-700"
            variant="badge"
          >
            {(n) => (
              <>
                <span className="text-ink-950 font-semibold">
                  {n.toLocaleString()}
                </span>
                &nbsp;founders &amp; operators already on the list
              </>
            )}
          </WaitlistCount>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative rounded-3xl bg-white border border-black/10 p-6 sm:p-8 shadow-[0_18px_60px_-20px_rgba(26,26,24,0.18)]"
        >
          {done ? (
            <SuccessCard
              email={values.email}
              onReset={() => {
                setValues(EMPTY);
                setDone(false);
              }}
            />
          ) : (
            <form onSubmit={submit} className="relative space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Name"
                  required
                  value={values.name}
                  onChange={(v) => update('name', v)}
                  placeholder="Alex Doe"
                  autoComplete="name"
                />
                <Field
                  label="Work email"
                  type="email"
                  required
                  value={values.email}
                  onChange={(v) => update('email', v)}
                  placeholder="alex@yourcompany.com"
                  autoComplete="email"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Company"
                  value={values.company}
                  onChange={(v) => update('company', v)}
                  placeholder="Acme Corp"
                  autoComplete="organization"
                />
                <div>
                  <label className="text-[11px] font-medium text-ink-600 uppercase tracking-wider font-mono">
                    Role
                  </label>
                  <select
                    value={values.role}
                    onChange={(e) => update('role', e.target.value)}
                    className="mt-1.5 w-full rounded-xl bg-cream-50 border border-black/10 px-3.5 py-2.5 text-sm text-ink-950 focus:border-rust focus:outline-none focus:ring-2 focus:ring-rust/20 transition-colors"
                  >
                    <option value="">Select…</option>
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-ink-600 uppercase tracking-wider font-mono">
                  What would you search for first?
                </label>
                <textarea
                  value={values.use_case}
                  onChange={(e) => update('use_case', e.target.value)}
                  rows={3}
                  placeholder="e.g. every postmortem that mentioned payments latency…"
                  className="mt-1.5 w-full rounded-xl bg-cream-50 border border-black/10 px-3.5 py-2.5 text-sm text-ink-950 placeholder-ink-600/50 focus:border-rust focus:outline-none focus:ring-2 focus:ring-rust/20 transition-colors resize-none"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-rust/30 bg-rust/5 px-3.5 py-2.5 text-sm text-rust-dark">
                  {error}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="group relative overflow-hidden w-full sm:w-auto rounded-full bg-ink-950 text-white px-7 py-3 text-sm font-semibold hover:bg-ink-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10">
                    {busy ? 'Submitting…' : 'Request access'}
                  </span>
                </button>
                <p className="text-xs text-ink-600 text-center sm:text-left">
                  We'll only email you about beta access. No newsletters.
                </p>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="text-[11px] font-medium text-ink-600 uppercase tracking-wider font-mono">
        {label}
        {required && <span className="text-rust ml-0.5">*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="mt-1.5 w-full rounded-xl bg-cream-50 border border-black/10 px-3.5 py-2.5 text-sm text-ink-950 placeholder-ink-600/50 focus:border-rust focus:outline-none focus:ring-2 focus:ring-rust/20 transition-colors"
      />
    </div>
  );
}

function SuccessCard({ email, onReset }: { email: string; onReset: () => void }) {
  return (
    <div className="relative py-8 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-rust text-white shadow-lg shadow-rust/30 mb-5">
        <svg
          viewBox="0 0 24 24"
          className="w-7 h-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <h3 className="font-serif text-2xl text-ink-950">
        You're on the list
      </h3>
      <p className="mt-2 text-sm text-ink-700 max-w-sm mx-auto">
        We'll reach out at <span className="text-ink-950 font-medium">{email}</span> as
        soon as a beta slot opens up.
      </p>
      <button
        onClick={onReset}
        className="mt-5 text-xs text-ink-600 hover:text-rust underline underline-offset-4"
      >
        Add another email
      </button>
    </div>
  );
}
