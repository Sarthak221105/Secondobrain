import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { ROLES, setCurrentRole, type Role } from '../../lib/role';
import { contentFor } from '../../lib/roleContent';

const ROLE_EMOJI: Record<Role, string> = {
  engineering: '🛠️',
  hr: '🧑‍💼',
  sales: '📈',
  finance: '💰',
  executive: '🧭',
  admin: '🛡️',
};

const ROLE_ACCENT: Record<Role, string> = {
  engineering: 'from-sky-500 to-blue-600',
  hr: 'from-emerald-500 to-teal-600',
  sales: 'from-amber-500 to-orange-600',
  finance: 'from-lime-500 to-green-600',
  executive: 'from-violet-500 to-purple-600',
  admin: 'from-rose-500 to-red-600',
};

/**
 * Cream "click-to-try" centerpiece. Clicking a card pre-seeds
 * localStorage so the demo opens already scoped to that role.
 */
export default function RoleShowcase() {
  const router = useRouter();

  function tryAs(role: Role) {
    setCurrentRole(role);
    router.push('/search');
  }

  return (
    <section id="roles" className="relative py-28 bg-cream-50">
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-14"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ink-600 font-mono">
            See it yourself
          </p>
          <h2 className="mt-4 font-serif text-3xl sm:text-5xl text-ink-950 leading-[1.05] tracking-tight">
            Pick a role.{' '}
            <span className="italic text-rust">See exactly what they see.</span>
          </h2>
          <p className="mt-5 text-ink-700 max-w-xl">
            Same query, different answer — because the permission filter runs
            on every retrieval. Click any card to jump into the demo scoped to
            that role.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.07 } },
          }}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {ROLES.map((role) => {
            const content = contentFor(role);
            return (
              <motion.button
                key={role}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  show: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -4 }}
                onClick={() => tryAs(role)}
                className="group relative overflow-hidden text-left rounded-2xl bg-white border border-black/10 p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)] hover:border-rust/40 hover:shadow-[0_14px_40px_-18px_rgba(194,85,59,0.25)] transition-all"
              >
                <span
                  aria-hidden
                  className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${ROLE_ACCENT[role]} opacity-80 group-hover:opacity-100 transition-opacity`}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{ROLE_EMOJI[role]}</span>
                    <h3 className="font-serif text-xl text-ink-950 capitalize">
                      {role}
                    </h3>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-ink-600 group-hover:text-rust transition-colors">
                    Try →
                  </span>
                </div>

                <p className="mt-4 text-sm text-ink-700 leading-relaxed min-h-[3.5rem]">
                  {content.blurb}
                </p>

                <div className="mt-5 space-y-1.5 border-t border-black/10 pt-4">
                  {content.suggestedQueries.slice(0, 3).map((q) => (
                    <div
                      key={q}
                      className="flex items-start gap-2 text-xs text-ink-700"
                    >
                      <span className="text-rust shrink-0">›</span>
                      <span className="line-clamp-1">{q}</span>
                    </div>
                  ))}
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
