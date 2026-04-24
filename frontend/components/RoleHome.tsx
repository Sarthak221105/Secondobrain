import type { Role } from '../lib/role';
import { contentFor } from '../lib/roleContent';

type Props = {
  role: Role | null;
  onPickQuery: (q: string) => void;
};

/**
 * The "landing" panel shown on the home page when the user has not yet
 * searched. Its content is driven by the caller's role so flipping the
 * dev-mode role switcher produces a visibly different page.
 *
 * Admin gets an extra quick-actions strip.
 */
export default function RoleHome({ role, onPickQuery }: Props) {
  const c = contentFor(role);
  const isAdmin = role === 'admin';

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-brand font-semibold">
              {role ?? 'employee'}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-gray-900">
              {c.greeting}
            </h2>
            <p className="mt-1 text-sm text-gray-600 max-w-xl">{c.blurb}</p>
          </div>
          <div className="hidden md:flex flex-col items-end gap-1 shrink-0">
            <span className="text-[10px] uppercase tracking-wide text-gray-400">
              You can search
            </span>
            <div className="flex flex-wrap justify-end gap-1">
              {c.sources.map((s) => (
                <span
                  key={s}
                  className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">
          Try asking
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {c.suggestedQueries.map((q) => (
            <button
              key={q}
              onClick={() => onPickQuery(q)}
              className="text-left rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 hover:border-brand hover:bg-brand/5 transition-colors"
            >
              <span className="text-brand mr-2">→</span>
              {q}
            </button>
          ))}
        </div>
      </section>

      {isAdmin && (
        <section className="rounded-lg border border-brand/30 bg-brand/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Admin shortcuts
              </h3>
              <p className="text-xs text-gray-600 mt-0.5">
                Upload documents, manage role assignments, or review the audit log.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <a
                href="/admin"
                className="rounded bg-brand px-3 py-1.5 text-white text-sm font-medium hover:bg-brand-dark"
              >
                Open admin
              </a>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
