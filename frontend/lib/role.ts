// Dev-mode role picker storage.
//
// When NEXT_PUBLIC_AUTH_ENABLED is "false" the frontend doesn't run Firebase
// SSO — instead the user picks a role from the header dropdown. That choice
// is persisted in localStorage and sent to the backend as `X-Dev-Role` on
// every request.

export const ROLES = [
  'engineering',
  'hr',
  'sales',
  'finance',
  'executive',
  'admin',
] as const;

export type Role = (typeof ROLES)[number];

const STORAGE_KEY = 'es.dev_role';
const DEFAULT_ROLE: Role = 'engineering';

export function isAuthEnabled(): boolean {
  // Treat only the literal string "true" as enabled so unset === disabled.
  return process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true';
}

export function getCurrentRole(): Role {
  if (typeof window === 'undefined') return DEFAULT_ROLE;
  const v = window.localStorage.getItem(STORAGE_KEY);
  return (ROLES as readonly string[]).includes(v ?? '') ? (v as Role) : DEFAULT_ROLE;
}

export function setCurrentRole(role: Role): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, role);
}
