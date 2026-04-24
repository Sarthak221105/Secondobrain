"""Audit logging — Firestore when available, in-memory otherwise.

In production every search is written to the ``audit_logs`` Firestore
collection. In local / dev setups (no Firebase service account) the logger
falls back to an in-process ring buffer so the admin dashboard still has
something useful to show. The fallback is signalled in the log output so
operators can tell the two apart.
"""

from __future__ import annotations

import logging
import threading
from collections import deque
from datetime import datetime, timezone
from typing import Deque

from ..config import get_settings
from ..models.user import AuditLogEntry

logger = logging.getLogger(__name__)

_MEMORY_LIMIT = 1000


class AuditLogger:
    """Thin wrapper with Firestore-first / in-memory-fallback semantics."""

    def __init__(self, client=None) -> None:
        """Build a Firestore client or fall back to the in-memory buffer.

        Construction NEVER raises — if Firestore is unreachable the logger
        silently switches to memory. This keeps search working even when the
        audit pipeline is degraded.
        """
        settings = get_settings()
        self._collection = settings.firestore_audit_collection
        self._client = client
        self._memory: Deque[dict] = deque(maxlen=_MEMORY_LIMIT)
        self._lock = threading.Lock()

        if self._client is None:
            try:
                from google.cloud import firestore

                self._client = firestore.Client(project=settings.gcp_project_id)
                logger.info("AuditLogger using Firestore project=%s", settings.gcp_project_id)
            except Exception as exc:
                logger.warning(
                    "AuditLogger falling back to in-memory buffer (Firestore "
                    "unavailable: %s). Entries will NOT persist across restarts.",
                    exc,
                )
                self._client = None

    @property
    def backend(self) -> str:
        """Return ``"firestore"`` or ``"memory"`` for diagnostics."""
        return "firestore" if self._client is not None else "memory"

    def log_search(
        self,
        *,
        user_id: str,
        user_email: str,
        query: str,
        result_count: int,
        ip_address: str | None,
    ) -> None:
        """Persist a single search event. Errors are logged but never raised."""
        entry = AuditLogEntry(
            user_id=user_id,
            user_email=user_email,
            query=query,
            result_count=result_count,
            timestamp=datetime.now(tz=timezone.utc).isoformat(),
            ip_address=ip_address,
        )
        payload = entry.model_dump()

        if self._client is not None:
            try:
                self._client.collection(self._collection).add(payload)
                return
            except Exception:
                logger.exception("Firestore write failed; keeping entry in memory")

        with self._lock:
            self._memory.appendleft(payload)

    def recent(
        self, limit: int = 1000, user_id: str | None = None
    ) -> list[dict]:
        """Return the most recent entries, optionally filtered by user."""
        if self._client is not None:
            try:
                from google.cloud import firestore as _fs

                query = self._client.collection(self._collection)
                if user_id:
                    query = query.where("user_id", "==", user_id)
                query = query.order_by(
                    "timestamp", direction=_fs.Query.DESCENDING
                ).limit(limit)
                return [doc.to_dict() for doc in query.stream()]
            except Exception:
                logger.exception("Firestore read failed; returning in-memory buffer")

        with self._lock:
            rows = list(self._memory)
        if user_id:
            rows = [r for r in rows if r.get("user_id") == user_id]
        return rows[:limit]
