import { useEffect, useState } from 'react';
import {
  getCurrentRole,
  isAuthEnabled,
  ROLES,
  setCurrentRole,
  type Role,
} from '../lib/role';

/**
 * Dropdown that lets the operator toggle between admin and employee views
 * while real auth is disabled.
 *
 * Renders nothing when NEXT_PUBLIC_AUTH_ENABLED=true — real identity comes
 * from Firebase in that case and the switcher would be misleading.
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
    // Reload so every in-flight/cached `/auth/me` response is re-fetched with
    // the new X-Dev-Role header.
    if (typeof window !== 'undefined') window.location.reload();
  }

  return (
    <label className="flex items-center gap-1.5 text-xs text-gray-600">
      <span className="uppercase tracking-wide">View as</span>
      <select
        value={role}
        onChange={(e) => handleChange(e.target.value as Role)}
        className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-brand focus:outline-none"
        aria-label="Switch role"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
    </label>
  );
}
