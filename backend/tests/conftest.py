"""Shared test fixtures."""

from __future__ import annotations

from datetime import datetime, timezone

import pytest

from backend.models.document import SearchResult, Source
from backend.models.user import Role, User


@pytest.fixture
def now() -> datetime:
    """A stable ``datetime`` for deterministic tests."""
    return datetime(2026, 4, 18, 12, 0, 0, tzinfo=timezone.utc)


def make_user(role: Role, email: str = "alice@example.com") -> User:
    """Build a test :class:`User` with the given role."""
    return User(uid=f"uid-{role.value}", email=email, role=role)


def make_result(
    *,
    chunk_id: str = "d1::0::aa",
    title: str = "Doc",
    allowed_roles: list[str] | None = None,
    owner_email: str = "alice@example.com",
    source: Source = Source.GOOGLE_DRIVE,
) -> SearchResult:
    """Build a test :class:`SearchResult`."""
    return SearchResult(
        doc_id=chunk_id.split("::")[0],
        chunk_id=chunk_id,
        title=title,
        snippet="...",
        source=source,
        owner_email=owner_email,
        last_modified=datetime(2026, 1, 1, tzinfo=timezone.utc),
        relevance_score=1.0,
        allowed_roles=allowed_roles or [],
    )
