import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQS = [
  {
    q: 'Where does my data go?',
    a: 'Everything stays inside your private GCP VPC. Embeddings go to Pinecone (or a local store), raw text to Elasticsearch. No third-party AI vendor sees your documents in the prod configuration.',
  },
  {
    q: 'How do permissions actually work?',
    a: 'Every chunk carries an allowed_roles list. The permission filter runs after retrieval and before the results leave the backend — admin bypass is explicit, never implicit. Empty ACLs default to owner-only (fail-closed).',
  },
  {
    q: 'What sources do you connect to today?',
    a: 'Google Drive, Slack, Gmail, and Jira via their official APIs, plus direct PDF / DOCX / TXT / MD uploads from the admin console. Pull cadence is configurable per source.',
  },
  {
    q: 'Can I deploy this on my own infra?',
    a: 'Yes — the stack is Dockerized and the included Terraform provisions a GCP VPC, IAM, and KMS. No vendor lock-in beyond the AI provider you choose (Vertex, OpenAI-compatible, or self-hosted).',
  },
  {
    q: 'What\u2019s the pricing?',
    a: 'We\u2019re shaping plans during the private beta. If you join the waitlist we\u2019ll share early-access economics the moment they\u2019re final.',
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="relative py-28 bg-cream-50">
      <div className="relative max-w-4xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rust">
            Frequently asked
          </p>
          <h2 className="mt-3 font-serif text-4xl sm:text-5xl text-ink-950 leading-[1.1] tracking-tight">
            Answers before you <span className="italic text-rust">ask</span>.
          </h2>
        </motion.div>

        <div className="divide-y divide-black/10 border-y border-black/10">
          {FAQS.map((f, i) => (
            <FaqRow key={f.q} index={i} q={f.q} a={f.a} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqRow({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-6 py-5 text-left group"
        aria-expanded={open}
      >
        <span className="font-serif text-lg sm:text-xl text-ink-950 group-hover:text-rust transition-colors">
          {q}
        </span>
        <span
          className={`flex items-center justify-center w-8 h-8 rounded-full border border-black/15 text-ink-700 shrink-0 transition-all ${
            open ? 'bg-ink-950 border-ink-950 text-white rotate-45' : ''
          }`}
          aria-hidden
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <p className="pb-5 pr-12 text-sm sm:text-base text-ink-700 leading-relaxed max-w-2xl">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
