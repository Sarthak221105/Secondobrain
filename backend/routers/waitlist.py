"""Public waitlist endpoint + admin read-back.

``POST /waitlist/join`` is intentionally unauthenticated — it's the
landing-page marketing form. ``GET /waitlist`` is admin-only and lets the
operator review signups from the admin dashboard.
"""

from __future__ import annotations

import logging
from typing import Annotated

import httpx
from fastapi import APIRouter, Depends

from ..models.user import Role, User
from ..services._singletons import get_waitlist_store
from ..services.waitlist import WaitlistEntry
from .auth import require_roles

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/waitlist", tags=["waitlist"])

# Email where Formsubmit sends notifications on every waitlist signup.
_NOTIFY_EMAIL = "abhinaytiwari542@gmail.com"
_FORMSUBMIT_URL = f"https://formsubmit.co/ajax/{_NOTIFY_EMAIL}"


async def _send_notification(entry_data: dict) -> None:
    """Fire-and-forget email notification via Formsubmit.

    Uses the AJAX endpoint so we get JSON back (not a redirect).
    Failures are logged but never block the signup response.
    """
    payload = {
        "_subject": f"🧠 New SecondoBrain Waitlist Signup — {entry_data.get('name', 'unknown')}",
        "Name": entry_data.get("name", ""),
        "Email": entry_data.get("email", ""),
        "Company": entry_data.get("company") or "—",
        "Role": entry_data.get("role") or "—",
        "Use Case": entry_data.get("use_case") or "—",
        "Signed Up At": entry_data.get("created_at", ""),
        "_template": "table",
    }
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.post(_FORMSUBMIT_URL, json=payload)
            if resp.status_code == 200:
                logger.info("Formsubmit notification sent for %s", entry_data.get("email"))
            else:
                logger.warning(
                    "Formsubmit returned %s for %s: %s",
                    resp.status_code,
                    entry_data.get("email"),
                    resp.text[:200],
                )
    except Exception:
        logger.exception("Formsubmit notification failed for %s", entry_data.get("email"))


@router.post("/join", response_model=dict)
async def join_waitlist(entry: WaitlistEntry) -> dict:
    """Accept a signup from the landing page. No auth required."""
    store = get_waitlist_store()
    saved = store.add(entry)
    logger.info(
        "waitlist signup: %s (%s) via %s",
        saved.get("email"),
        saved.get("company") or "—",
        store.backend,
    )

    # Vercel serverless functions freeze immediately after returning the response,
    # which causes FastAPI BackgroundTasks to fail or cancel. 
    # We must await the fire-and-forget notification inline.
    await _send_notification(saved)

    # Include the current total so the frontend can update its counter from
    # the success response without a second round-trip.
    total = len(store.all())
    return {
        "ok": True,
        "backend": store.backend,
        "created_at": saved.get("created_at"),
        "total": total,
        "position": total,
    }


@router.get("/stats", response_model=dict)
async def waitlist_stats() -> dict:
    """Public waitlist counter used by the landing page.

    Returns only the total count — no PII, no listing. A floored-to-10
    ``displayed`` value gives marketing copy a stable number to anchor
    "Join 40+ others" while the real ``total`` is available for admins.
    """
    total = len(get_waitlist_store().all())
    return {
        "total": total,
        "displayed": _display_total(total),
    }


@router.get("", response_model=list[dict])
async def list_signups(
    _admin: Annotated[User, Depends(require_roles(Role.ADMIN))],
) -> list[dict]:
    """Admin-only — return every signup, newest first."""
    return get_waitlist_store().all()


def _display_total(total: int) -> int:
    """Round down to a marketing-friendly number.

    * 0–9   → shown as-is (no point rounding to 0)
    * 10–99 → floor to nearest 10
    * 100+  → floor to nearest 50
    """
    if total < 10:
        return total
    if total < 100:
        return (total // 10) * 10
    return (total // 50) * 50
