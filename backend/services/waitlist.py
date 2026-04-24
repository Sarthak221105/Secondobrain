"""Waitlist storage — Firestore primary, JSON-file fallback.

The landing page's "Join the waitlist" form posts here. We try to write to
the ``waitlist`` Firestore collection first; if Firestore credentials are
missing or the call fails, we append to a local JSON file so testing-phase
signups aren't lost.
"""

from __future__ import annotations

import json
import logging
import os
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from pydantic import BaseModel, EmailStr, Field

from ..config import get_settings

logger = logging.getLogger(__name__)

_LOCAL_PATH = Path(os.getenv("WAITLIST_LOCAL_PATH", "/tmp/waitlist.json"))
_COLLECTION = os.getenv("WAITLIST_COLLECTION", "waitlist")


class WaitlistEntry(BaseModel):
    """Payload the landing form sends us."""

    name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr
    company: str | None = Field(default=None, max_length=160)
    role: str | None = Field(default=None, max_length=80)
    use_case: str | None = Field(default=None, max_length=800)


class WaitlistStore:
    """Persist waitlist signups with graceful fallback."""

    def __init__(self, client=None) -> None:
        """Try Firestore; fall back to on-disk JSON if not configured."""
        settings = get_settings()
        self._client = client
        self._collection = _COLLECTION
        self._path = _LOCAL_PATH
        self._lock = threading.Lock()

        if self._client is None:
            try:
                from google.cloud import firestore

                self._client = firestore.Client(project=settings.gcp_project_id)
                logger.info("WaitlistStore using Firestore collection=%s", self._collection)
            except Exception as exc:
                logger.warning(
                    "WaitlistStore falling back to JSON file %s (Firestore "
                    "unavailable: %s). Signups will persist locally only.",
                    self._path,
                    exc,
                )
                self._client = None

    @property
    def backend(self) -> str:
        """Return ``"firestore"`` or ``"local"`` for diagnostics."""
        return "firestore" if self._client is not None else "local"

    def add(self, entry: WaitlistEntry) -> dict:
        """Store a new signup. Returns the saved record."""
        record: dict[str, Any] = entry.model_dump()
        record["created_at"] = datetime.now(tz=timezone.utc).isoformat()

        if self._client is not None:
            try:
                _ref_tuple = self._client.collection(self._collection).add(record)
                # firestore.add returns (timestamp, DocumentReference)
                try:
                    record["id"] = _ref_tuple[1].id
                except Exception:
                    record["id"] = None
                return record
            except Exception:
                logger.exception("Firestore waitlist write failed; falling back to local file")

        self._append_local(record)
        return record

    def all(self) -> list[dict]:
        """Return every signup in reverse-chronological order."""
        if self._client is not None:
            try:
                from google.cloud import firestore as _fs

                docs = (
                    self._client.collection(self._collection)
                    .order_by("created_at", direction=_fs.Query.DESCENDING)
                    .stream()
                )
                return [{"id": d.id, **d.to_dict()} for d in docs]
            except Exception:
                logger.exception("Firestore waitlist read failed; returning local file")

        return list(reversed(self._load_local()))

    def _append_local(self, record: dict) -> None:
        """Append ``record`` to the local JSON array, creating the file if needed."""
        with self._lock:
            existing = self._load_local()
            existing.append(record)
            try:
                self._path.parent.mkdir(parents=True, exist_ok=True)
                self._path.write_text(
                    json.dumps(existing, ensure_ascii=False, indent=2),
                    encoding="utf-8",
                )
            except Exception:
                logger.exception("Failed to persist waitlist to %s", self._path)

    def _load_local(self) -> list[dict]:
        """Return the contents of the local JSON file, or an empty list."""
        if not self._path.exists():
            return []
        try:
            return json.loads(self._path.read_text(encoding="utf-8"))
        except Exception:
            logger.exception("Failed to read %s; treating as empty", self._path)
            return []
