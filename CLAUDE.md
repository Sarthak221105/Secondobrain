# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Private, company-internal AI search engine. FastAPI backend + Next.js
frontend. Documents are ingested from Drive / Slack / Gmail / Jira (and
admin uploads), chunked, embedded with Vertex AI, and stored in Pinecone
(semantic) + Elasticsearch (keyword). Every search runs hybrid retrieval,
merges with RRF, filters by role, and streams a Gemini answer.

All code lives under `enterprise-search/`. Docker Compose runs the stack;
Terraform under `infrastructure/` provisions the GCP VPC and IAM.

## Common commands

Run all of these from `enterprise-search/` unless noted.

```bash
# Start / stop the stack (Elasticsearch + backend + frontend).
docker compose up --build -d
docker compose down

# Rebuild just the backend when requirements.txt or Python code changes.
docker compose build --no-cache backend && docker compose up -d backend
docker compose logs backend --tail 50 -f

# Health probe — shows AUTH_ENABLED, DLP_ENABLED, and whether pdf/docx parsers load.
curl http://localhost:8000/healthz

# Backend tests (run from enterprise-search/backend).
cd backend && pip install -r requirements.txt && pytest -q
pytest -q tests/test_permission_filter.py            # single file
pytest -q tests/test_rag.py::TestStream              # single class
pytest -q -k "empty_allowed_roles"                   # single test by name

# Frontend typecheck + build.
cd frontend && npm install && npm run typecheck && npm run build

# Terraform plan / apply (requires GCP creds).
cd infrastructure && terraform init && terraform plan -var="project_id=YOUR_PROJECT"

# Seed demo docs (requires backend running + Pinecone creds).
docker compose exec backend python -m scripts.smoke_index

# Grant yourself the first admin role (bootstrap for real Firebase mode).
python scripts/bootstrap_admin.py --email you@example.com
```

## Architecture essentials

### Search pipeline — the critical path

On every query, `backend/routers/search.py` does this in order:

1. `get_current_user()` (from `routers/auth.py`) verifies the caller and
   returns a `User` with a `role`.
2. `HybridSearcher.search()` in `services/search.py` runs Pinecone + ES
   **in parallel** via `asyncio.gather` and merges with RRF.
3. `filter_results()` from `services/permission_filter.py` **must** run
   before returning any result. This is the only place ACLs are enforced.
4. Top 3 filtered results → `RAGGenerator.stream()` streams Gemini tokens
   over NDJSON (`/search/stream`) or returns a plain string (`/search`).
5. `AuditLogger.log_search()` writes to Firestore `audit_logs`. Failures
   are swallowed so audit problems don't break search — check logs.

**Invariant:** never return a result list that hasn't been through
`permission_filter.filter_results()`. Even "admin sees everything" is
enforced there, not short-circuited at the router.

### Ingestion pipeline

`services/indexer.py` → `Indexer.index_document(doc)` is the one entry
point. It chunks (`tiktoken`, 512 tokens / 50 overlap), runs each chunk
through the `Scanner` protocol (either `DLPScanner` or `NoOpScanner`),
embeds with Vertex AI, and upserts into Pinecone + Elasticsearch in a
single call. The admin upload route (`POST /admin/documents`) and the
smoke script both use this same function — there's no alternate path.

### Dev-mode auth bypass (subtle — easy to break)

The project has a dual-flag convention that **must stay in sync**:

| Flag                          | Where             | Meaning                          |
| ----------------------------- | ----------------- | -------------------------------- |
| `AUTH_ENABLED`                | `backend/.env`    | Backend verifies Firebase JWTs.  |
| `NEXT_PUBLIC_AUTH_ENABLED`    | `frontend/.env.local` | Frontend sends JWT vs `X-Dev-Role`. |

When both are `false` (dev default), `routers/auth.py::get_current_user`
short-circuits Firebase and synthesizes a `User` from two headers:
`X-Dev-Role` (any `ALL_ROLES` value, default `engineering`) and optional
`X-Dev-Email`. The frontend `RoleSwitcher` component writes the chosen
role into localStorage and `lib/api.ts::authHeader()` injects the header.
If someone changes only one side, `/auth/me` returns 401 and the whole
UI breaks.

**When reintroducing real auth**: flip both flags to `true`, drop a
Firebase service account key at `backend/secrets/firebase.json`, then run
`scripts/bootstrap_admin.py --email ...` so the first user has a role
claim.

### DLP is optional and fail-closed

`services/dlp_scanner.py` exposes a `Scanner` protocol with two
implementations. `build_scanner()` picks between them based on
`DLP_ENABLED` in `backend/.env`:

- `DLPScanner` (prod) — on any DLP error returns empty `safe_text` so
  the indexer drops the chunk. Failures are a feature, not a bug.
- `NoOpScanner` (dev) — pass-through; emits one loud warning per process.

The `google-cloud-dlp` import in this module is guarded with try/except
so the backend still boots without the package. Similarly, `pypdf` and
`python-docx` in `services/document_parser.py` are imported lazily
**inside** the extractor functions — do not hoist them to module top,
because that would crash backend startup on any image without those libs.

### Source of truth files

When modifying behavior, read these first. They're the files most
likely to break things if edited naively:

- `backend/routers/auth.py` — JWT + dev bypass + role gating. All routes
  that take a `User` parameter go through `get_current_user`.
- `backend/services/permission_filter.py` — ACL rules. Empty
  `allowed_roles` means **owner-only** (fail-closed), not "everyone."
  Admin always passes. Tests in `tests/test_permission_filter.py`
  assert this contract.
- `backend/services/indexer.py` — single ingestion path for *all*
  sources (connectors + uploads). If you add a new `Source` enum value,
  you don't need to touch this file.
- `backend/services/search.py` — RRF merge uses constant `RRF_K = 60`.
  Ordering of the input lists doesn't matter; identity is `chunk_id`.
- `frontend/lib/api.ts::authHeader()` — single place the auth header is
  chosen. Multipart uploads use the same helper but intentionally
  **don't** set `Content-Type` (browser fills the boundary).

## Roles & permissions

Six roles: `hr, engineering, sales, finance, executive, admin`.
Canonical list is `ALL_ROLES` in `backend/models/user.py` and `ROLES` in
`frontend/lib/role.ts` — keep them in sync. Uploads via
`/admin/documents` always include `admin` in `allowed_roles` server-side
even if the admin unchecks it in the UI.

## Testing conventions

- `pytest` is configured in `backend/pytest.ini` with
  `asyncio_mode = auto`; async tests don't need an explicit decorator.
- The critical tests are `test_permission_filter.py`,
  `test_dlp_scanner.py`, `test_rag.py`. These mock Vertex / DLP clients
  by passing them through constructor injection — preserve that pattern
  when adding tests so nothing hits the network.
- Fixtures live in `tests/conftest.py` with `make_user()` and
  `make_result()` helpers.

## Non-negotiables

- `permission_filter.filter_results()` runs on every search result list.
- DLP is fail-closed in `DLPScanner`: a scan error → chunk dropped, not
  indexed. Don't "fix" this to re-raise.
- Every search goes through `AuditLogger.log_search()` before the
  response is returned, including streaming responses.
- `backend/.env` and `frontend/.env.local` are gitignored — never commit
  them or the Firebase service account JSON in `backend/secrets/`.
- The `google-cloud-dlp`, `pypdf`, and `python-docx` imports stay lazy.
  Hoisting them will crash startup on minimal dev images.

## Layout

```
enterprise-search/
├── backend/
│   ├── main.py                  FastAPI entrypoint + /healthz
│   ├── config.py                env-var Settings (lru_cached)
│   ├── routers/                 auth · search · admin
│   ├── services/                indexer · embedder · dlp_scanner ·
│   │                            permission_filter · rag · search ·
│   │                            audit · document_parser
│   ├── models/                  user · document (pydantic)
│   └── tests/                   pytest, async mode auto
├── frontend/
│   ├── pages/                   index · login · admin · _app
│   ├── components/              SearchBar · ResultCard · AISummary ·
│   │                            RoleSwitcher · DocumentUpload
│   └── lib/                     api · firebase · role
├── infrastructure/              Terraform (VPC, IAM, KMS)
├── scripts/                     bootstrap_admin · smoke_index
├── docker-compose.yml
└── .github/workflows/deploy.yml
```
