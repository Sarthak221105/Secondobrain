import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { isAuthEnabled } from '../lib/role';

/**
 * The Firebase SSO flow is temporarily disabled.
 *
 * When `NEXT_PUBLIC_AUTH_ENABLED=false` this page simply bounces back to the
 * home page — every API call uses the X-Dev-Role header instead of a JWT.
 *
 * To restore Firebase login later:
 *   1. Set `NEXT_PUBLIC_AUTH_ENABLED=true` in frontend/.env.local
 *   2. Set `AUTH_ENABLED=true` in backend/.env
 *   3. Re-introduce the `signInWithSSO` flow here (see git history or
 *      `lib/firebase.ts` which is still wired up).
 */
export default function LoginPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthEnabled()) {
      router.replace('/search');
    }
  }, [router]);

  async function handleSignIn() {
    setBusy(true);
    setError(null);
    try {
      const { signInWithSSO } = await import('../lib/firebase');
      await signInWithSSO();
      router.replace('/search');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  if (!isAuthEnabled()) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <p className="text-sm text-gray-500">
          Auth is disabled — redirecting to search…
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow">
        <h1 className="text-2xl font-bold text-gray-900">Secondo Brain</h1>
        <p className="mt-2 text-sm text-gray-600">
          Sign in with your company Google account. MFA is required.
        </p>
        <button
          onClick={handleSignIn}
          disabled={busy}
          className="mt-6 w-full rounded-lg bg-brand px-4 py-3 text-white font-medium shadow hover:bg-brand-dark disabled:opacity-50"
        >
          {busy ? 'Signing in…' : 'Sign in with SSO'}
        </button>
        {error && (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
