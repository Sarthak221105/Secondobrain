"""Admin endpoints — role assignment, audit log access, and document upload.

All routes in this router require the caller to have the ``admin`` role.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from firebase_admin import auth as fb_auth

from ..models.document import Document, Source
from ..models.user import ALL_ROLES, Role, RoleAssignment, User
from ..services._singletons import get_audit_logger
from ..services.document_parser import UnsupportedFileType, extract_text
from ..services.indexer import Indexer
from .auth import require_roles

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])

_indexer: Indexer | None = None


def _get_audit():
    """Shared audit logger singleton (so admin sees search entries)."""
    return get_audit_logger()


def _get_indexer() -> Indexer:
    """Return the process-wide :class:`Indexer`, built on first use."""
    global _indexer
    if _indexer is None:
        _indexer = Indexer.default()
    return _indexer


@router.post("/roles", response_model=dict)
async def assign_role(
    payload: RoleAssignment,
    admin: Annotated[User, Depends(require_roles(Role.ADMIN))],
) -> dict:
    """Set a custom ``role`` claim on the target Firebase user.

    The target user's existing claims are preserved; only ``role`` is updated.
    """
    try:
        existing = fb_auth.get_user(payload.target_uid)
    except fb_auth.UserNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        ) from exc

    claims = dict(existing.custom_claims or {})
    claims["role"] = payload.role.value
    fb_auth.set_custom_user_claims(payload.target_uid, claims)

    logger.info(
        "admin %s set role=%s on user %s",
        admin.uid,
        payload.role.value,
        payload.target_uid,
    )
    return {
        "target_uid": payload.target_uid,
        "role": payload.role.value,
        "set_by": admin.uid,
    }


@router.get("/audit", response_model=list[dict])
async def audit(
    _admin: Annotated[User, Depends(require_roles(Role.ADMIN))],
    user_id: str | None = Query(default=None),
    limit: int = Query(default=1000, ge=1, le=1000),
) -> list[dict]:
    """Return up to ``limit`` recent audit log entries, optionally per-user."""
    return _get_audit().recent(limit=limit, user_id=user_id)


def _parse_roles(raw: str) -> list[str]:
    """Parse a comma-separated role list and validate each entry.

    Admin is always added so administrators can read back their own uploads.
    """
    roles = {r.strip().lower() for r in raw.split(",") if r.strip()}
    if not roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="allowed_roles must include at least one role",
        )
    unknown = roles - set(ALL_ROLES)
    if unknown:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"unknown role(s): {sorted(unknown)}",
        )
    roles.add(Role.ADMIN.value)
    return sorted(roles)


@router.post("/documents", response_model=dict)
async def upload_documents(
    admin: Annotated[User, Depends(require_roles(Role.ADMIN))],
    files: list[UploadFile] = File(..., description="One or more documents."),
    allowed_roles: str = Form(
        ...,
        description="Comma-separated role list controlling who can see these docs.",
    ),
) -> dict:
    """Parse, chunk, embed, and index admin-uploaded files.

    Supports PDF, DOCX, TXT, MD, LOG, and CSV. Unknown file types are
    reported as ``skipped`` in the per-file status list (HTTP 200 overall).

    Returns a summary like::

        {
          "uploaded": [
            {"filename": "handbook.pdf", "status": "indexed",
             "doc_id": "upload::...", "chunks": 7},
            {"filename": "data.xlsx", "status": "skipped",
             "reason": "cannot parse .xlsx files"}
          ]
        }
    """
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="at least one file is required",
        )

    role_list = _parse_roles(allowed_roles)
    indexer = _get_indexer()
    results: list[dict] = []

    for upload in files:
        filename = upload.filename or "unnamed"
        try:
            data = await upload.read()
        finally:
            await upload.close()

        if not data:
            results.append(
                {"filename": filename, "status": "skipped", "reason": "empty file"}
            )
            continue

        try:
            text = extract_text(filename, data)
        except UnsupportedFileType as exc:
            logger.info("skipping %s: %s", filename, exc)
            results.append(
                {"filename": filename, "status": "skipped", "reason": str(exc)}
            )
            continue
        except Exception:
            logger.exception("failed to parse %s", filename)
            results.append(
                {"filename": filename, "status": "error", "reason": "parse failed"}
            )
            continue

        if not text.strip():
            results.append(
                {
                    "filename": filename,
                    "status": "skipped",
                    "reason": "no extractable text",
                }
            )
            continue

        now = datetime.now(tz=timezone.utc)
        doc = Document(
            doc_id=f"upload::{uuid.uuid4().hex}",
            source=Source.UPLOAD,
            title=filename,
            body=text,
            owner_email=admin.email,
            allowed_roles=role_list,
            created_at=now,
            last_modified=now,
        )

        try:
            n_chunks = indexer.index_document(doc)
        except Exception:
            logger.exception("index_document failed for %s", filename)
            results.append(
                {"filename": filename, "status": "error", "reason": "indexing failed"}
            )
            continue

        logger.info(
            "admin %s uploaded %s as %s (%d chunks, roles=%s)",
            admin.uid,
            filename,
            doc.doc_id,
            n_chunks,
            role_list,
        )
        results.append(
            {
                "filename": filename,
                "status": "indexed" if n_chunks else "skipped",
                "doc_id": doc.doc_id,
                "chunks": n_chunks,
                "allowed_roles": role_list,
                **({} if n_chunks else {"reason": "no chunks produced"}),
            }
        )

    return {"uploaded": results}
