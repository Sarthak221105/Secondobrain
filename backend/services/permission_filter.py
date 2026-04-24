"""Post-search permission filter.

Runs **after** the hybrid search has already merged ranked results. Any result
whose ``allowed_roles`` list does not include the caller's role is dropped.

Rules:

* ``admin`` sees everything — they can audit the full corpus.
* A missing or empty ``allowed_roles`` list is treated as private and only the
  document owner (or an admin) can see it. This is a fail-closed default so
  bugs in the ingestion pipeline do not leak data.
* The filter never mutates the input list; it returns a new list.

The filter is intentionally pure and sync so it is trivial to unit-test and
cannot introduce I/O into the hot path.
"""

from __future__ import annotations

import logging
from collections.abc import Iterable

from ..models.document import SearchResult
from ..models.user import Role, User

logger = logging.getLogger(__name__)


def is_authorized(
    user: User,
    allowed_roles: Iterable[str],
    owner_email: str | None = None,
) -> bool:
    """Return ``True`` iff ``user`` may see a document with these ACLs.

    ``admin`` always returns ``True``. If ``allowed_roles`` is empty only the
    owner (matched by email) is authorized — the fail-closed default.
    """
    if user.role == Role.ADMIN:
        return True

    roles = {r for r in allowed_roles if r}
    if not roles:
        return owner_email is not None and owner_email == user.email

    return user.role.value in roles


def filter_results(
    user: User, results: list[SearchResult]
) -> list[SearchResult]:
    """Return a new list containing only results ``user`` is authorized to see.

    The original ranking order is preserved. Dropped results are counted and
    logged so regressions (for example a source that forgets to set
    ``allowed_roles``) are visible in dashboards.
    """
    filtered: list[SearchResult] = []
    dropped = 0
    for r in results:
        if is_authorized(user, r.allowed_roles, r.owner_email):
            filtered.append(r)
        else:
            dropped += 1

    if dropped:
        logger.info(
            "permission_filter dropped %d of %d results for user=%s role=%s",
            dropped,
            len(results),
            user.uid,
            user.role.value,
        )
    return filtered


def metadata_is_authorized(user: User, metadata: dict) -> bool:
    """Convenience wrapper for Pinecone/Elasticsearch metadata dicts."""
    return is_authorized(
        user,
        metadata.get("allowed_roles", []) or [],
        metadata.get("owner_email"),
    )
