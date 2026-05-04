import { getCurrentRole, isAuthEnabled } from './role';

const BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://secondobrain.onrender.com';

export type SearchResult = {
  doc_id: string;
  chunk_id: string;
  title: string;
  snippet: string;
  source: string;
  owner_email: string;
  last_modified: string;
  relevance_score: number;
  allowed_roles: string[];
  url?: string | null;
};

export type SearchResponse = {
  query: string;
  results: SearchResult[];
  answer?: string | null;
  took_ms: number;
  mode: 'hybrid' | 'semantic' | 'keyword';
};

/**
 * Return the request header that identifies the caller.
 *
 * Two modes:
 * - NEXT_PUBLIC_AUTH_ENABLED=true  → real Firebase JWT (dynamic import so we
 *   don't initialize Firebase when auth is off).
 * - NEXT_PUBLIC_AUTH_ENABLED=false → send X-Dev-Role from the role picker.
 */
async function authHeader(): Promise<Record<string, string>> {
  if (!isAuthEnabled()) {
    return { 'X-Dev-Role': getCurrentRole() };
  }
  const { getIdToken } = await import('./firebase');
  const token = await getIdToken();
  if (!token) throw new Error('Not signed in');
  return { Authorization: `Bearer ${token}` };
}

export async function fetchMe() {
  const res = await fetch(`${BASE}/auth/me`, { headers: await authHeader() });
  if (!res.ok) throw new Error(`auth/me failed: ${res.status}`);
  return res.json();
}

export async function search(query: string, topK = 10): Promise<SearchResponse> {
  const res = await fetch(`${BASE}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify({ query, top_k: topK, include_answer: true }),
  });
  if (!res.ok) throw new Error(`search failed: ${res.status}`);
  return res.json();
}

export async function* streamSearch(
  query: string,
  topK = 10,
): AsyncGenerator<
  { type: 'results'; results: SearchResult[]; took_ms: number }
  | { type: 'token'; text: string }
  | { type: 'done' }
> {
  const res = await fetch(`${BASE}/search/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify({ query, top_k: topK, include_answer: true }),
  });
  if (!res.ok || !res.body) throw new Error(`stream failed: ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl;
    while ((nl = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line) continue;
      yield JSON.parse(line);
    }
  }
}

export async function fetchAudit(userId?: string, limit = 1000) {
  const qs = new URLSearchParams();
  if (userId) qs.set('user_id', userId);
  qs.set('limit', String(limit));
  const res = await fetch(`${BASE}/admin/audit?${qs}`, {
    headers: await authHeader(),
  });
  if (!res.ok) throw new Error(`audit failed: ${res.status}`);
  return res.json();
}

export type WaitlistPayload = {
  name: string;
  email: string;
  company?: string;
  role?: string;
  use_case?: string;
};

export type WaitlistJoinResponse = {
  ok: boolean;
  backend: 'firestore' | 'local';
  created_at: string;
  total: number;
  position: number;
};

export async function joinWaitlist(
  payload: WaitlistPayload,
): Promise<WaitlistJoinResponse> {
  // Public endpoint — no auth header required.
  const res = await fetch(`${BASE}/waitlist/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let detail = `waitlist failed: ${res.status}`;
    try {
      const j = await res.json();
      if (typeof j?.detail === 'string') detail = `${detail} — ${j.detail}`;
      else if (Array.isArray(j?.detail)) {
        const msgs = j.detail
          .map((d: { loc?: unknown[]; msg?: string }) =>
            `${(d.loc ?? []).slice(1).join('.')}: ${d.msg ?? ''}`.trim(),
          )
          .join('; ');
        detail = `${detail} — ${msgs}`;
      }
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return res.json();
}

export type WaitlistStats = {
  total: number;
  /** Floored to a marketing-friendly number; safe to show publicly. */
  displayed: number;
};

/** Public — used by the landing page to show live signup count. */
export async function fetchWaitlistStats(): Promise<WaitlistStats> {
  const res = await fetch(`${BASE}/waitlist/stats`);
  if (!res.ok) throw new Error(`waitlist stats failed: ${res.status}`);
  return res.json();
}

export type WaitlistEntry = {
  id?: string;
  name: string;
  email: string;
  company?: string | null;
  role?: string | null;
  use_case?: string | null;
  created_at: string;
};

/** Admin — full waitlist. */
export async function fetchWaitlistEntries(): Promise<WaitlistEntry[]> {
  const res = await fetch(`${BASE}/waitlist`, {
    headers: await authHeader(),
  });
  if (!res.ok) throw new Error(`waitlist list failed: ${res.status}`);
  return res.json();
}

export async function assignRole(target_uid: string, role: string) {
  const res = await fetch(`${BASE}/admin/roles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify({ target_uid, role }),
  });
  if (!res.ok) throw new Error(`assign role failed: ${res.status}`);
  return res.json();
}

export type UploadResult = {
  filename: string;
  status: 'indexed' | 'skipped' | 'error';
  doc_id?: string;
  chunks?: number;
  allowed_roles?: string[];
  reason?: string;
};

export async function uploadDocuments(
  files: File[],
  allowedRoles: string[],
): Promise<{ uploaded: UploadResult[] }> {
  const form = new FormData();
  for (const f of files) form.append('files', f);
  form.append('allowed_roles', allowedRoles.join(','));
  // NOTE: do NOT set Content-Type — the browser fills in the multipart boundary.
  const res = await fetch(`${BASE}/admin/documents`, {
    method: 'POST',
    headers: { ...(await authHeader()) },
    body: form,
  });
  if (!res.ok) {
    let detail = `upload failed: ${res.status}`;
    try {
      const j = await res.json();
      if (typeof j?.detail === 'string') {
        detail = `${detail} — ${j.detail}`;
      } else if (Array.isArray(j?.detail)) {
        // FastAPI 422 Pydantic errors: array of {loc, msg, type}
        const msgs = j.detail
          .map((d: { loc?: unknown[]; msg?: string }) =>
            `${(d.loc ?? []).join('.')}: ${d.msg ?? ''}`.trim(),
          )
          .join('; ');
        detail = `${detail} — ${msgs}`;
      } else if (j) {
        detail = `${detail} — ${JSON.stringify(j)}`;
      }
    } catch {
      /* response was not JSON */
    }
    throw new Error(detail);
  }
  return res.json();
}
