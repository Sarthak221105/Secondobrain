"""In-memory vector store used when Pinecone isn't configured.

Mimics the subset of the Pinecone ``Index`` interface we actually call:
``upsert(vectors=[...])`` and ``query(vector=..., top_k=..., include_metadata=..)``.
Similarity uses cosine. Vectors persist to ``/tmp/local_vectors.json`` so an
admin upload survives a backend restart.

Good enough for demos and tests. Swap to real Pinecone in production by
setting ``PINECONE_API_KEY`` — :class:`Indexer` will pick the real client
automatically.
"""

from __future__ import annotations

import json
import logging
import math
import os
import threading
from dataclasses import dataclass
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

_DEFAULT_PATH = Path(os.getenv("LOCAL_VECTOR_STORE_PATH", "/tmp/local_vectors.json"))


@dataclass
class _Entry:
    values: list[float]
    metadata: dict[str, Any]


class LocalVectorIndex:
    """Drop-in stand-in for a single Pinecone index."""

    def __init__(self, path: Path = _DEFAULT_PATH) -> None:
        """Load any persisted vectors; start empty on first run."""
        self._path = path
        self._store: dict[str, _Entry] = {}
        self._lock = threading.Lock()
        self._load()

    # ---- public API (mirrors Pinecone) -----------------------------------

    def upsert(self, vectors: list[dict]) -> dict:
        """Insert or overwrite a list of ``{id, values, metadata}`` entries."""
        with self._lock:
            for v in vectors:
                self._store[v["id"]] = _Entry(
                    values=list(v["values"]),
                    metadata=dict(v.get("metadata") or {}),
                )
            self._persist()
        return {"upserted_count": len(vectors)}

    def query(
        self,
        vector: list[float],
        top_k: int = 10,
        include_metadata: bool = True,
        include_values: bool = False,
    ) -> dict:
        """Return the ``top_k`` entries with highest cosine similarity."""
        with self._lock:
            items = list(self._store.items())

        scored = [
            (chunk_id, _cosine(vector, entry.values), entry)
            for chunk_id, entry in items
        ]
        scored.sort(key=lambda t: t[1], reverse=True)

        matches = []
        for chunk_id, score, entry in scored[:top_k]:
            hit: dict = {"id": chunk_id, "score": score}
            if include_metadata:
                hit["metadata"] = dict(entry.metadata)
            if include_values:
                hit["values"] = list(entry.values)
            matches.append(hit)
        return {"matches": matches}

    def describe_index_stats(self) -> dict:
        """Return vector count so admin UIs can show an indicator."""
        with self._lock:
            return {"total_vector_count": len(self._store)}

    # ---- persistence -----------------------------------------------------

    def _load(self) -> None:
        """Populate the in-memory dict from the JSON snapshot, if present."""
        if not self._path.exists():
            return
        try:
            raw = json.loads(self._path.read_text(encoding="utf-8"))
            self._store = {
                k: _Entry(values=v["values"], metadata=v.get("metadata", {}))
                for k, v in raw.items()
            }
            logger.info("LocalVectorIndex loaded %d vectors from %s",
                        len(self._store), self._path)
        except Exception:
            logger.exception("Failed to load %s; starting empty", self._path)

    def _persist(self) -> None:
        """Write the current dict back to disk. Best-effort."""
        try:
            self._path.parent.mkdir(parents=True, exist_ok=True)
            payload = {
                k: {"values": v.values, "metadata": v.metadata}
                for k, v in self._store.items()
            }
            self._path.write_text(json.dumps(payload), encoding="utf-8")
        except Exception:
            logger.exception("Failed to persist vectors to %s", self._path)


class LocalPineconeStub:
    """Stand-in for the top-level ``Pinecone`` client.

    Only implements ``.Index(name)``. All indexes share the same on-disk
    file; the name is informational.
    """

    def __init__(self) -> None:
        """No-op constructor."""
        self._default_index = LocalVectorIndex()

    def Index(self, _name: str) -> LocalVectorIndex:  # noqa: N802
        """Return the single local index regardless of name."""
        return self._default_index


def _cosine(a: list[float], b: list[float]) -> float:
    """Cosine similarity between two vectors of equal length."""
    if not a or not b:
        return 0.0
    n = min(len(a), len(b))
    dot = sum(a[i] * b[i] for i in range(n))
    na = math.sqrt(sum(x * x for x in a[:n]))
    nb = math.sqrt(sum(x * x for x in b[:n]))
    if na == 0.0 or nb == 0.0:
        return 0.0
    return dot / (na * nb)
