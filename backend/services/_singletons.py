"""Process-wide singletons so routers share in-memory state.

FastAPI routers are imported independently, so if each router creates its
own :class:`AuditLogger` the in-memory audit buffer ends up fragmented —
the search router logs to buffer A while the admin router reads buffer B
and always sees it empty. Funnel both through the accessors here.
"""

from __future__ import annotations

from .audit import AuditLogger
from .waitlist import WaitlistStore

_audit: AuditLogger | None = None
_waitlist: WaitlistStore | None = None


def get_audit_logger() -> AuditLogger:
    """Return the process-wide :class:`AuditLogger`, created on first use."""
    global _audit
    if _audit is None:
        _audit = AuditLogger()
    return _audit


def get_waitlist_store() -> WaitlistStore:
    """Return the process-wide :class:`WaitlistStore`, created on first use."""
    global _waitlist
    if _waitlist is None:
        _waitlist = WaitlistStore()
    return _waitlist
