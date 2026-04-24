import { motion } from 'framer-motion';

/**
 * A static product-preview card shown on the right of the hero. Purely
 * decorative — no real data. Modeled on the Secondo Brain reference.
 */
export default function DashboardMockup() {
  return (
    <div className="relative">
      {/* Callout bubble */}
      <div className="absolute -bottom-3 right-4 z-10 hidden sm:flex items-center gap-1.5 rounded-full bg-ink-950 text-white text-xs font-medium px-3 py-1.5 shadow-lg">
        <span className="h-1.5 w-1.5 rounded-full bg-rust" />
        A preview of the Admin dashboard
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.25 }}
        className="relative rounded-2xl bg-white/80 backdrop-blur border border-black/10 shadow-[0_8px_48px_-8px_rgba(26,26,24,0.15)] overflow-hidden"
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-black/5 px-4 py-2.5">
          <span className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-black/10" />
            <span className="w-2 h-2 rounded-full bg-black/10" />
            <span className="w-2 h-2 rounded-full bg-black/10" />
          </span>
          <span className="text-xs text-ink-600 ml-2">
            app.secondobrain.com <span className="text-ink-600/50">/ dashboard</span>
          </span>
        </div>

        {/* Body: sidebar + main */}
        <div className="grid grid-cols-[130px_1fr] min-h-[420px]">
          <aside className="border-r border-black/5 bg-cream-50/60 p-3 space-y-1">
            <div className="flex items-center gap-2 pb-2 mb-1 border-b border-black/5">
              <span className="w-5 h-5 rounded-full bg-ink-950 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-rust" />
              </span>
              <span className="font-serif text-sm text-ink-900">Secondo</span>
            </div>
            {[
              { label: 'Home', active: true },
              { label: 'Search' },
              { label: 'Uploads' },
              { label: 'Audit' },
              { label: 'Roles' },
              { label: 'Automations' },
              { label: 'People' },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded ${
                  item.active
                    ? 'bg-ink-950 text-white'
                    : 'text-ink-700 hover:text-ink-900'
                }`}
              >
                <span
                  className={`w-1 h-1 rounded-full ${
                    item.active ? 'bg-rust' : 'bg-ink-700/40'
                  }`}
                />
                {item.label}
              </div>
            ))}
          </aside>

          <main className="p-5 space-y-4">
            <div>
              <h3 className="font-serif text-lg text-ink-900">
                Good morning, Alex.
              </h3>
              <p className="text-[11px] text-ink-600 mt-0.5">
                Wednesday · Here's what's happening today.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <Stat big="47" label="Questions today" trend="+12%" />
              <Stat big="23" label="Active users" trend="+4" />
              <Stat big="5" label="Unanswered" trendAccent />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Panel title="Recent activity">
                <ActivityRow who="Priya" what="asked about GST on vendor credit notes" when="2m" />
                <ActivityRow who="Amit" what="uploaded Q2_Leave_Policy_v4.pdf" when="14m" />
                <ActivityRow who="Neha" what="drafted refund reply to Client ABC" when="28m" />
              </Panel>
              <Panel title="Top questions this week" serif>
                <QuestionRow>What is the refund policy?</QuestionRow>
                <QuestionRow>How to raise a GST invoice?</QuestionRow>
                <QuestionRow>Leave carry-forward rule?</QuestionRow>
                <QuestionRow>Vendor onboarding steps?</QuestionRow>
              </Panel>
            </div>
          </main>
        </div>
      </motion.div>
    </div>
  );
}

function Stat({
  big,
  label,
  trend,
  trendAccent,
}: {
  big: string;
  label: string;
  trend?: string;
  trendAccent?: boolean;
}) {
  return (
    <div className="rounded-lg bg-cream-50 border border-black/5 p-3">
      <div className="font-serif text-2xl text-ink-900 leading-none">{big}</div>
      <div className="mt-1.5 text-[9px] uppercase tracking-wider text-ink-600">
        {label}
      </div>
      {trend && (
        <div
          className={`mt-1 text-[10px] ${
            trendAccent ? 'text-rust' : 'text-ink-600'
          }`}
        >
          {trendAccent ? 'needs doc' : trend}
        </div>
      )}
    </div>
  );
}

function Panel({
  title,
  serif,
  children,
}: {
  title: string;
  serif?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-cream-50 border border-black/5 p-3">
      <p className="text-[9px] uppercase tracking-widest text-rust mb-2">
        {title}
      </p>
      <div className={`space-y-1.5 ${serif ? 'font-serif italic' : ''}`}>
        {children}
      </div>
    </div>
  );
}

function ActivityRow({
  who,
  what,
  when,
}: {
  who: string;
  what: string;
  when: string;
}) {
  return (
    <div className="flex items-start gap-1.5 text-[10px] text-ink-700">
      <span className="mt-1 h-1 w-1 rounded-full bg-rust shrink-0" />
      <span className="flex-1 line-clamp-1">
        <strong className="text-ink-900">{who}</strong> {what}
      </span>
      <span className="text-ink-600">{when}</span>
    </div>
  );
}

function QuestionRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-1.5 text-[11px] text-ink-800">
      <span className="text-rust">›</span>
      <span className="line-clamp-1">{children}</span>
    </div>
  );
}
