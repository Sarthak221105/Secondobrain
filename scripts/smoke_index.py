"""Seed a few demo documents so search returns something on day one.

Run this once after bootstrap_admin.py to populate Pinecone + Elasticsearch
with a handful of permission-tagged documents spanning multiple roles. Useful
to verify the full ingestion → search → RAG pipeline end-to-end.

Usage (from the repo root):
    # Load backend/.env into your shell, then:
    python scripts/smoke_index.py

Or inside the backend container:
    docker compose exec backend python -m scripts.smoke_index
"""

from __future__ import annotations

import sys
from datetime import datetime, timezone
from pathlib import Path

# Allow running as `python scripts/smoke_index.py` from the repo root.
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.models.document import Document, Source  # noqa: E402
from backend.services.indexer import Indexer  # noqa: E402

NOW = datetime.now(tz=timezone.utc)

DEMO_DOCS: list[Document] = [
    Document(
        doc_id="demo-eng-q1",
        source=Source.GOOGLE_DRIVE,
        title="Engineering Q1 Retrospective",
        body=(
            "Engineering delivered 98% of committed Q1 roadmap items. "
            "Latency on the search API improved from 420ms p95 to 180ms "
            "after the Pinecone hybrid ranker landed. Hiring closed 4 of 5 "
            "open roles. Carryover to Q2: realtime ingestion from Slack."
        ),
        owner_email="eng-lead@example.com",
        allowed_roles=["engineering", "executive"],
        created_at=NOW,
        last_modified=NOW,
        url="https://drive.example.com/eng-q1",
    ),
    Document(
        doc_id="demo-hr-handbook",
        source=Source.GOOGLE_DRIVE,
        title="Employee Handbook - PTO policy",
        body=(
            "All full-time employees accrue 20 days of PTO per year, plus "
            "10 company holidays. PTO requests should be submitted in "
            "BambooHR at least two weeks in advance. Unlimited sick leave "
            "is available with manager approval."
        ),
        owner_email="hr@example.com",
        allowed_roles=["hr", "engineering", "sales", "finance", "executive"],
        created_at=NOW,
        last_modified=NOW,
    ),
    Document(
        doc_id="demo-fin-budget",
        source=Source.GOOGLE_DRIVE,
        title="FY26 Budget - Confidential",
        body=(
            "The FY26 operating budget is $42.5M, up 18% YoY. Largest "
            "line items: engineering headcount ($18M), cloud infra ($6M), "
            "go-to-market ($9M). Reserve for unplanned hires: $2.1M."
        ),
        owner_email="cfo@example.com",
        allowed_roles=["finance", "executive"],
        created_at=NOW,
        last_modified=NOW,
    ),
    Document(
        doc_id="demo-sales-playbook",
        source=Source.SLACK,
        title="Enterprise sales playbook - discovery call",
        body=(
            "Open every discovery call with the 3-question framework: "
            "(1) What does success look like in 12 months? "
            "(2) Who else is involved in the decision? "
            "(3) What breaks if nothing changes? Aim for 20 minutes of "
            "listening before pitching."
        ),
        owner_email="sales-ops@example.com",
        allowed_roles=["sales", "executive"],
        created_at=NOW,
        last_modified=NOW,
    ),
]


def main() -> None:
    """Index every demo document and print a summary."""
    indexer = Indexer.default()
    total = 0
    for doc in DEMO_DOCS:
        n = indexer.index_document(doc)
        print(f"  {doc.doc_id:20s} → {n} chunks")
        total += n
    print(f"done. indexed {total} chunks across {len(DEMO_DOCS)} docs.")


if __name__ == "__main__":
    main()
