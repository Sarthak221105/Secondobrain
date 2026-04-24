import { motion } from 'framer-motion';

/**
 * Three-step user-journey section. Alternates copy and visual columns
 * for visual rhythm. Each visual is a small inline mockup (no external
 * assets) styled to feel like a screenshot from the product.
 *
 * Sits between the Modules grid and the more technical Flow / pipeline
 * section. Anchored at `#how-it-works` so the existing `#how` anchor on
 * Flow keeps working.
 */
export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-28 bg-cream-50">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-16"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ink-600 font-mono">
            How it works
          </p>
          <h2 className="mt-4 font-serif text-4xl sm:text-6xl text-ink-950 leading-[1.02] tracking-tight">
            Three calm steps.{' '}
            <span className="italic text-rust">No cleanup required.</span>
          </h2>
        </motion.div>

        <div className="space-y-20 sm:space-y-24">
          <Step
            number="01"
            title="Pour in what you already have."
            body="Drag files, sync a Drive folder, forward emails. No cleanup required. Secondo Brain reads, summarizes, and tags everything quietly in the background."
            tags={['PDFs', 'Word', 'Excel', 'WhatsApp docs', 'Scans']}
            visual={<KnowledgeBaseVisual />}
            visualFirst
          />
          <Step
            number="02"
            title="Every employee gets their own second brain."
            body="A calm morning briefing, tasks, follow-ups, decisions — private to each person. Owners see usage and gaps, never private notes."
            tags={['Morning briefing', 'Tasks', 'Follow-ups', 'Decision log']}
            visual={<BriefingVisual />}
          />
          <Step
            number="03"
            title="Ask. Write. Automate. Repeat."
            body="Your team asks questions in Hindi or English, drafts emails, records meetings. You get honest dashboards of what's working — and what's missing."
            tags={['Cites sources', 'Speaks your tone', 'Quietly automates']}
            visual={<ChatVisual />}
            visualFirst
          />
        </div>
      </div>
    </section>
  );
}

type StepProps = {
  number: string;
  title: string;
  body: string;
  tags: string[];
  visual: React.ReactNode;
  visualFirst?: boolean;
};

function Step({ number, title, body, tags, visual, visualFirst }: StepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6 }}
      className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center"
    >
      <div className={visualFirst ? 'order-1 lg:order-1' : 'order-1 lg:order-2'}>
        {visual}
      </div>
      <div className={visualFirst ? 'order-2 lg:order-2' : 'order-2 lg:order-1'}>
        <p className="font-serif italic text-2xl text-rust">{number}</p>
        <h3 className="mt-3 font-serif text-3xl sm:text-4xl text-ink-950 leading-tight tracking-tight">
          {title}
        </h3>
        <p className="mt-5 text-ink-700 leading-relaxed max-w-lg">{body}</p>
        <div className="mt-6 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center rounded-full border border-black/10 bg-white px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-ink-700"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Inline visual mockups                                                       */
/* -------------------------------------------------------------------------- */

function KnowledgeBaseVisual() {
  const chips: [string, string, 'g' | 'r'][] = [
    ['HR Policies', '12 docs', 'g'],
    ['Finance SOPs', '8 docs', 'g'],
    ['Sales Playbook', '5 docs', 'g'],
    ['Legal Contracts', '21 docs', 'r'],
    ['Product Manuals', '7 docs', 'r'],
  ];
  return (
    <div className="relative rounded-2xl bg-white border border-black/10 shadow-[0_8px_40px_-12px_rgba(26,26,24,0.12)] p-5 max-w-md">
      <h4 className="font-serif text-lg text-ink-950">Knowledge Base</h4>
      <p className="text-[11px] font-mono text-ink-600 mt-1">
        15 documents · 4,208 auto-indexed
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {chips.map(([label, count, kind]) => (
          <span
            key={label}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] ${
              kind === 'g'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-rust/25 bg-rust/10 text-rust-dark'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                kind === 'g' ? 'bg-emerald-500' : 'bg-rust'
              }`}
            />
            {label}
            <span className="text-ink-600/80 font-mono text-[10px]">
              {count}
            </span>
          </span>
        ))}
      </div>

      <div className="mt-5 border-t border-black/5 pt-4 space-y-1.5">
        <p className="text-[10px] font-mono uppercase tracking-widest text-rust">
          ○ Processing
        </p>
        <p className="text-xs text-ink-700">
          Summarized Refund_Policy_v3.pdf in 3 lines
        </p>
        <p className="text-xs text-ink-700">
          Auto-tagged 4 contracts: #NDA, #MSA, #vendor
        </p>
        <p className="text-xs text-ink-700">
          Flagged conflict between two leave policies
        </p>
      </div>
    </div>
  );
}

function BriefingVisual() {
  type Task = { color: string; text: string; due: string };
  const tasks: Task[] = [
    { color: 'bg-rust', text: 'Prepare Q2 client deck', due: 'Due today · 3 PM' },
    {
      color: 'bg-amber-500',
      text: 'Follow-up with Ramesh on invoice #4421',
      due: 'Due today',
    },
    { color: 'bg-sky-500', text: 'Approve leave request for Tanya', due: 'Today' },
    { color: 'bg-emerald-500', text: 'Send weekly summary to Rajesh', due: 'Friday' },
  ];
  return (
    <div className="relative rounded-2xl bg-white border border-black/10 shadow-[0_8px_40px_-12px_rgba(26,26,24,0.12)] p-5 max-w-md ml-auto">
      <p className="text-[10px] font-mono uppercase tracking-widest text-ink-600">
        Wednesday · 08:14
      </p>
      <h4 className="mt-2 font-serif text-xl text-ink-950">
        Good morning, Priya.
      </h4>
      <p className="text-xs text-ink-600 mt-1">
        3 tasks · 2 follow-ups · 1 meeting today.
      </p>

      <ul className="mt-4 divide-y divide-black/5">
        {tasks.map((t) => (
          <li
            key={t.text}
            className="flex items-center gap-3 py-2.5 text-xs"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${t.color} shrink-0`} />
            <span className="flex-1 text-ink-900 line-clamp-1">{t.text}</span>
            <span className="text-ink-600 font-mono text-[10px] whitespace-nowrap">
              {t.due}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChatVisual() {
  return (
    <div className="relative rounded-2xl bg-white border border-black/10 shadow-[0_8px_40px_-12px_rgba(26,26,24,0.12)] p-5 max-w-md">
      <p className="text-[10px] font-mono text-ink-600">
        app.secondobrain.com <span className="text-ink-600/50">/ ask</span>
      </p>

      {/* Question bubble */}
      <div className="mt-4 flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-ink-950 text-white px-4 py-2.5 text-xs leading-relaxed">
          What is our refund policy for orders older than 7 days?
        </div>
      </div>

      {/* Answer */}
      <div className="mt-3 rounded-xl border border-black/10 bg-cream-50/60 p-3">
        <p className="text-xs text-ink-800 leading-relaxed">
          Refund requests must be raised within 7 days of purchase. Approved
          refunds are processed in 5–7 business days. Exceptions require
          manager sign-off.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-black/10 bg-white px-2 py-0.5 text-[10px] font-mono text-ink-700">
            <span className="text-rust">◆</span> Refund_Policy_v3.pdf
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            High confidence
          </span>
        </div>
      </div>

      {/* Input */}
      <div className="mt-4 flex items-center gap-2 rounded-full border border-black/10 bg-cream-50/40 px-3.5 py-2">
        <span className="flex-1 text-[11px] text-ink-600">
          Type in English, Hindi, or Hinglish…
        </span>
        <button className="rounded-full bg-ink-950 text-white text-[10px] font-medium px-3 py-1">
          Send
        </button>
      </div>
    </div>
  );
}
