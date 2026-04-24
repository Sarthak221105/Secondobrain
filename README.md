# Enterprise Search

Private, company-internal AI search engine. Employees ask natural-language
questions across Google Drive, Slack, Gmail, and Jira and get permission-filtered
results plus a grounded, cited answer from Gemini. Everything runs inside a
private GCP VPC; no data leaves the environment.

## Architecture

```
                                 Firebase Auth (SSO + MFA)
                                              │
                                              ▼ (ID token)
 ┌──────────────┐    HTTPS     ┌──────────────────────────┐
 │   Next.js    │─────────────▶│     FastAPI backend      │
 │   Frontend   │◀── NDJSON ───│     (JWT middleware)     │
 └──────────────┘              └────────┬──┬──┬──┬────────┘
                                        │  │  │  │
                            ┌───────────┘  │  │  └──────────┐
                            ▼              ▼  ▼             ▼
                    ┌──────────────┐  ┌────────┐  ┌──────────────┐
                    │   Pinecone   │  │ Elastic│  │  Vertex AI   │
                    │  (semantic)  │  │search  │  │ embed + RAG  │
                    └──────────────┘  └────────┘  └──────────────┘
                            ▲              ▲
                            │              │
                            └──── indexer ─┘
                                    │
                                    ▼
                            ┌──────────────┐
                            │  Cloud DLP   │
                            │ redact PII   │
                            └──────────────┘

                    ┌──────────────┐
                    │  Firestore   │  ← audit_logs (every query)
                    └──────────────┘

   Connectors (pull): Google Drive, Slack, Gmail, Jira
   All traffic: private VPC (subnet-app ↔ subnet-data), IAP-fronted ingress
```

### Query path
1. Frontend attaches Firebase ID token → backend verifies signature, extracts
   `uid` + `role`.
2. Semantic search (Pinecone) and keyword search (Elasticsearch) run **in
   parallel**.
3. Results are merged with Reciprocal Rank Fusion (RRF).
4. `permission_filter` drops any result whose `allowed_roles` does not include
   the user's role. `admin` bypasses; empty ACL → owner-only (fail-closed).
5. Top 3 authorized results → Gemini for a 2–3 sentence cited answer (streamed
   over NDJSON).
6. The query is logged to Firestore `audit_logs`.

### Ingestion path
1. Connector pulls docs from upstream (Drive / Slack / Gmail / Jira).
2. `tiktoken` chunks each doc (512 tokens, 50-token overlap).
3. Cloud DLP inspects each chunk; matching info-types are redacted in place
   before the chunk is embedded. DLP failures fail closed — the chunk is
   dropped rather than leaked.
4. Chunks are embedded with Vertex AI `text-embedding-004` and upserted into
   Pinecone (plus Elasticsearch for keyword search).

## Repo layout

```
enterprise-search/
├── backend/              FastAPI service
│   ├── main.py
│   ├── config.py
│   ├── routers/          auth · search · admin
│   ├── services/         indexer · embedder · dlp_scanner ·
│   │                     permission_filter · rag · search · audit
│   ├── models/           user · document (pydantic)
│   ├── tests/            unit tests for the critical path
│   └── Dockerfile
├── frontend/             Next.js + Tailwind
│   ├── pages/            index · login · admin
│   ├── components/       SearchBar · ResultCard · AISummary
│   ├── lib/              firebase · api
│   └── Dockerfile
├── infrastructure/       Terraform (GCP VPC, IAM, KMS)
│   ├── main.tf
│   ├── iam.tf
│   ├── variables.tf
│   └── outputs.tf
├── docker-compose.yml
├── .github/workflows/deploy.yml
└── CLAUDE.md
```

## Running locally

### Prerequisites
- Docker + Docker Compose
- A Firebase project (for SSO)
- GCP service account JSON with Vertex AI, Firestore, and Firebase Admin roles
  (add DLP User only if you enable DLP — see below)
- Pinecone index (dimension **768**, cosine metric) + API key

### Configure
```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
# Fill in project IDs, Firebase keys, Pinecone API key, etc.
# Place your Firebase service account JSON at backend/secrets/firebase.json
```

### Start
```bash
docker compose up --build
```

- Backend: http://localhost:8000/healthz
- Frontend: http://localhost:3000
- Elasticsearch: http://localhost:9200

### Dev auth mode (default)

Firebase SSO is **off by default** (`AUTH_ENABLED=false` in backend,
`NEXT_PUBLIC_AUTH_ENABLED=false` in frontend). In dev mode:

- There is no login page — visiting `/` drops you straight into the search UI.
- A **"View as"** dropdown in the header lets you switch between
  `engineering`, `hr`, `sales`, `finance`, `executive`, and `admin`. The
  choice is persisted in `localStorage` and sent to the backend as the
  `X-Dev-Role` header.
- Switch to `admin` to open the `/admin` dashboard; switch back to any other
  role to see the employee experience.
- The backend returns a synthetic user (`dev-<role>@example.com`) based on
  the header — no Firebase, no JWT.

To re-enable real auth later, flip both flags to `true`, fill in the Firebase
web config / service account JSON, and run the bootstrap script below.

### Bootstrap the first admin (only needed when AUTH_ENABLED=true)
The JWT middleware rejects users with no `role` custom claim. Grant yourself
`admin` once, then manage everyone else from `/admin`:
```bash
python scripts/bootstrap_admin.py --email you@example.com
# or: python scripts/bootstrap_admin.py <your_firebase_uid>
```
Sign out and back in so your ID token carries the new claim.

### Seed demo docs (optional)
`docker compose exec backend python -m scripts.smoke_index` writes four
permission-tagged demo documents (engineering, HR, finance, sales) so search
returns something immediately.

### Run tests
```bash
cd backend
pip install -r requirements.txt
pytest -q
```

### DLP (optional in dev)
Cloud DLP scanning is **off by default** (`DLP_ENABLED=false`). The indexer
uses a `NoOpScanner` that logs a warning and passes every chunk through
unscanned. **Never run that in production** — flip `DLP_ENABLED=true`, grant
the backend service account `roles/dlp.user`, and optionally set the
`DLP_INSPECT_TEMPLATE` / `DLP_DEIDENTIFY_TEMPLATE` env vars.

## Deployment (GCP)

1. Provision VPC, subnets, firewall, IAM, and KMS:
   ```bash
   cd infrastructure
   terraform init
   terraform apply -var="project_id=YOUR_PROJECT"
   ```
2. Push container images via the `deploy` GitHub Actions workflow
   (uses Workload Identity Federation — no long-lived JSON keys).
3. Cloud Run services run with ingress `internal-and-cloud-load-balancing` and
   require IAP for external access.

## Security checklist

- [x] Every API route behind Firebase JWT verification (reject 401 otherwise).
- [x] `permission_filter` runs on every result list; admin-only bypass.
- [x] Cloud DLP scans every chunk before it is indexed; failures fail closed.
- [x] All inter-service traffic uses internal VPC IPs; ingress only via IAP.
- [x] Every search is audit-logged to Firestore.
- [x] No long-lived service account keys in CI — WIF only.
- [x] Secrets (Pinecone, ES, Firebase) read from env vars / Secret Manager.
- [x] AES-256 KMS key (`google_kms_crypto_key.documents`) for doc-at-rest
      encryption; 90-day rotation.

## API

| Method | Path              | Auth  | Description                               |
|--------|-------------------|-------|-------------------------------------------|
| GET    | `/healthz`        | —     | Liveness probe                            |
| GET    | `/auth/me`        | JWT   | Authenticated user profile                |
| POST   | `/search`         | JWT   | Non-streaming hybrid search + RAG answer  |
| POST   | `/search/stream`  | JWT   | Streams results + RAG tokens as NDJSON    |
| POST   | `/admin/roles`    | admin | Set a user's role custom claim            |
| GET    | `/admin/audit`    | admin | Last N audit-log entries                  |

## Roles

`hr · engineering · sales · finance · executive · admin`

Every indexed chunk carries `allowed_roles`. The post-retrieval
`permission_filter` enforces access. `admin` sees everything.
