import { useEffect, useState } from 'react';
import {
  getCurrentRole,
  isAuthEnabled,
  ROLES,
  setCurrentRole,
  type Role,
} from '../lib/role';

/**
 * Dropdown that lets the operator toggle between roles while real auth is
 * disabled. Renders nothing when NEXT_PUBLIC_AUTH_ENABLED=true.
 */
export default function RoleSwitcher() {
  const [role, setRole] = useState<Role>('engineering');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setRole(getCurrentRole());
    setMounted(true);
  }, []);

  if (!mounted || isAuthEnabled()) return null;

  function handleChange(next: Role) {
    setCurrentRole(next);
    setRole(next);
    if (typeof window !== 'undefined') window.location.reload();
  }

  return (
    <label className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-ink-600">
      <span>View as</span>
      <div className="relative">
        <select
          value={role}
          onChange={(e) => handleChange(e.target.value as Role)}
          className="appearance-none rounded-full border border-black/10 bg-white/80 backdrop-blur pl-3 pr-7 py-1.5 text-[11px] font-mono uppercase tracking-[0.18em] text-ink-900 focus:border-rust focus:outline-none focus:ring-2 focus:ring-rust/20 transition-colors cursor-pointer"
          aria-label="Switch role"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-ink-600"
        >
          ▾
        </span>
      </div>
    </label>
  );
}
