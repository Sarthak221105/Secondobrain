"""Waitlist storage — MongoDB primary, JSON-file fallback.

The landing page's "Join the waitlist" form posts here. We try to write to
the ``waitlist`` MongoDB collection first; if MongoDB URI is missing or the
call fails, we append to a local JSON file so testing-phase signups aren't lost.
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
        """Try MongoDB; fall back to on-disk JSON if not configured."""
        settings = get_settings()
        self._client = client
        self._collection_name = _COLLECTION
        self._path = _LOCAL_PATH
        self._lock = threading.Lock()
        
        self._db = None
        self._collection = None

        if self._client is None and settings.mongodb_uri:
            try:
                from motor.motor_asyncio import AsyncIOMotorClient
                from pymongo.errors import ConfigurationError
                self._client = AsyncIOMotorClient(settings.mongodb_uri)
                # Default database name if not specified in URI
                try:
                    db_name = self._client.get_database().name
                except ConfigurationError:
                    db_name = "enterprise-search"
                self._db = self._client[db_name]
                self._collection = self._db[self._collection_name]
                logger.info("WaitlistStore using MongoDB collection=%s", self._collection_name)
            except Exception as exc:
                logger.warning(
                    "WaitlistStore falling back to JSON file %s (MongoDB "
                    "unavailable: %s). Signups will persist locally only.",
                    self._path,
                    exc,
                )
                self._client = None
                self._db = None
                self._collection = None

    @property
    def backend(self) -> str:
        """Return ``"mongodb"`` or ``"local"`` for diagnostics."""
        return "mongodb" if self._client is not None else "local"

    async def add(self, entry: WaitlistEntry) -> dict:
        """Store a new signup. Returns the saved record."""
        record: dict[str, Any] = entry.model_dump()
        record["created_at"] = datetime.now(tz=timezone.utc).isoformat()

        if self._collection is not None:
            try:
                result = await self._collection.insert_one(record)
                record["id"] = str(result.inserted_id)
                if "_id" in record:
                    del record["_id"]
                return record
            except Exception:
                logger.exception("MongoDB waitlist write failed; falling back to local file")

        self._append_local(record)
        return record

    async def all(self) -> list[dict]:
        """Return every signup in reverse-chronological order."""
        if self._collection is not None:
            try:
                cursor = self._collection.find().sort("created_at", -1)
                docs = await cursor.to_list(length=None)
                
                results = []
                for d in docs:
                    d_id = str(d.pop("_id", None))
                    results.append({"id": d_id, **d})
                return results
            except Exception:
                logger.exception("MongoDB waitlist read failed; returning local file")

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
