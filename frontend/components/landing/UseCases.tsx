import { motion } from 'framer-motion';

/**
 * "The Product" section — nine numbered modules that make up Secondo
 * Brain, presented as a cream-paper editorial grid. Some modules are live
 * today, some are on the near-term roadmap; the same card treatment is
 * fine for both during the testing phase.
 *
 * The section keeps its `#use-cases` id so the existing LandingHeader nav
 * anchor still resolves — the rename lives in the visible copy only.
 */

type Module = {
  number: string;
  title: string;
  body: string;
  tags: string[];
};

const MODULES: Module[] = [
  {
    number: '01',
    title: 'Company Brain',
    body: 'Drop in PDFs, policies, SOPs, contracts. Your AI reads, organizes, and answers questions citing the exact source.',
    tags: ['Drive / Dropbox sync', 'OCR on scans', 'Version history'],
  },
  {
    number: '02',
    title: 'Ask Anything',
    body: 'Chat in English, Hindi, or Hinglish — with voice or text. Every answer cites the page it came from.',
    tags: ['Voice + text', 'Source citations', 'Confidence score'],
  },
  {
    number: '03',
    title: 'Personal Second Brain',
    body: 'A private morning briefing, tasks, follow-ups, and notes for every employee. Theirs alone. Not visible to HR.',
    tags: ['Tasks + follow-ups', 'Voice memos', 'Daily briefing'],
  },
  {
    number: '04',
    title: 'AI Writing',
    body: 'Emails, proposals, vendor replies, HR letters — drafted in your tone, grounded in your actual policies.',
    tags: ['Formal / friendly / firm', 'Save as template'],
  },
  {
    number: '05',
    title: 'Meeting Intelligence',
    body: 'Record or paste a transcript. Get a clean MoM, decisions, and action items auto-assigned to each person.',
    tags: ['MoM in 2 minutes', 'Action items', 'Meeting search'],
  },
  {
    number: '06',
    title: 'Automation Center',
    body: 'No-code rules that quietly run your week — Monday summaries, contract renewals, onboarding, gentle nudges.',
    tags: ['WhatsApp + email', 'Pre-built templates', 'Custom triggers'],
  },
  {
    number: '07',
    title: 'Analytics',
    body: 'See what your company is really asking. Find knowledge gaps before they cost you.',
    tags: ['Usage by team', 'Unanswered questions', 'Health score'],
  },
  {
    number: '08',
    title: 'People & Permissions',
    body: 'Department-level access. Role-based visibility. Clean offboarding. Finance sees Finance.',
    tags: ['RBAC', 'Org chart', 'Audit log'],
  },
  {
    number: '09',
    title: 'Security & Trust',
    body: 'Encrypted at rest and in transit. Full audit trail. Your data, your export, anytime.',
    tags: ['2FA / SSO', 'IP whitelist', 'GDPR-ready export'],
  },
];

export default function UseCases() {
  return (
    <section id="use-cases" className="relative py-28 bg-cream-50">
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-16"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ink-600 font-mono">
            The product
          </p>
          <h2 className="mt-4 font-serif text-4xl sm:text-6xl text-ink-950 leading-[1.02] tracking-tight">
            Twelve modules.{' '}
            <span className="italic text-rust">One quiet system.</span>
          </h2>
          <p className="mt-6 text-ink-700 leading-relaxed max-w-2xl">
            Secondo Brain is not a chatbot bolted onto your tools. It is the
            connective tissue between your documents, your people, and your
            daily work.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.06 } },
          }}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {MODULES.map((m) => (
            <motion.article
              key={m.number}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -3 }}
              className="group relative rounded-2xl bg-white border border-black/10 p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)] hover:border-rust/40 hover:shadow-[0_14px_40px_-18px_rgba(194,85,59,0.25)] transition-all"
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-[11px] tracking-widest text-ink-600">
                  {m.number}
                </span>
                <span
                  aria-hidden
                  className="h-2 w-2 rounded-full bg-rust/70 group-hover:bg-rust transition-colors"
                />
              </div>

              <h3 className="mt-5 font-serif text-2xl text-ink-950 leading-tight">
                {m.title}
              </h3>
              <p className="mt-3 text-sm text-ink-700 leading-relaxed min-h-[4.5rem]">
                {m.body}
              </p>

              <div className="mt-5 flex flex-wrap gap-1.5">
                {m.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center rounded-full border border-black/10 bg-cream-50/70 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-ink-700"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
