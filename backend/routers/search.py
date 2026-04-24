"""Search endpoints — hybrid retrieval + permission filter + streamed RAG answer."""

from __future__ import annotations

import json
import logging
import time
from typing import Annotated

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse

from ..models.document import SearchRequest, SearchResponse
from ..models.user import User
from ..services._singletons import get_audit_logger
from ..services.permission_filter import filter_results
from ..services.rag import RAGGenerator
from ..services.search import HybridSearcher
from .auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/search", tags=["search"])

# Lazily instantiated singletons. We avoid module-level instantiation so that
# tests can monkeypatch or inject fakes before the first request.
_searcher: HybridSearcher | None = None
_rag: RAGGenerator | None = None


def _get_searcher() -> HybridSearcher:
    """Return the process-wide :class:`HybridSearcher`, creating on first use."""
    global _searcher
    if _searcher is None:
        _searcher = HybridSearcher.default()
    return _searcher


def _get_rag() -> RAGGenerator:
    """Return the process-wide :class:`RAGGenerator`."""
    global _rag
    if _rag is None:
        _rag = RAGGenerator()
    return _rag


def _get_audit():
    """Shared audit logger singleton (so admin sees search entries)."""
    return get_audit_logger()


@router.post("", response_model=SearchResponse)
async def search(
    payload: SearchRequest,
    request: Request,
    user: Annotated[User, Depends(get_current_user)],
) -> SearchResponse:
    """Run a non-streaming search.

    Pipeline: hybrid retrieval → permission filter → (optional) RAG answer.
    Every call is audit-logged before the response is returned.
    """
    started = time.perf_counter()

    raw = await _get_searcher().search(payload.query, top_k=max(payload.top_k * 3, 30))
    authorized = filter_results(user, raw)[: payload.top_k]

    answer: str | None = None
    if payload.include_answer and authorized:
        answer = _get_rag().generate(payload.query, authorized)

    _get_audit().log_search(
        user_id=user.uid,
        user_email=user.email,
        query=payload.query,
        result_count=len(authorized),
        ip_address=_client_ip(request),
    )

    return SearchResponse(
        query=payload.query,
        results=authorized,
        answer=answer,
        took_ms=int((time.perf_counter() - started) * 1000),
    )


@router.post("/stream")
async def search_stream(
    payload: SearchRequest,
    request: Request,
    user: Annotated[User, Depends(get_current_user)],
) -> StreamingResponse:
    """Stream the RAG answer token-by-token after sending the result list.

    The response is newline-delimited JSON (NDJSON):
    1. First line: ``{"type": "results", "results": [...], "took_ms": n}``.
    2. Subsequent lines: ``{"type": "token", "text": "..."}`` for each chunk.
    3. Final line: ``{"type": "done"}``.
    """
    started = time.perf_counter()

    raw = await _get_searcher().search(payload.query, top_k=max(payload.top_k * 3, 30))
    authorized = filter_results(user, raw)[: payload.top_k]

    _get_audit().log_search(
        user_id=user.uid,
        user_email=user.email,
        query=payload.query,
        result_count=len(authorized),
        ip_address=_client_ip(request),
    )

    took_ms = int((time.perf_counter() - started) * 1000)

    async def gen():
        yield json.dumps(
            {
                "type": "results",
                "query": payload.query,
                "results": [r.model_dump(mode="json") for r in authorized],
                "took_ms": took_ms,
            }
        ) + "\n"

        if authorized and payload.include_answer:
            async for token in _get_rag().stream(payload.query, authorized):
                yield json.dumps({"type": "token", "text": token}) + "\n"

        yield json.dumps({"type": "done"}) + "\n"

    return StreamingResponse(gen(), media_type="application/x-ndjson")


def _client_ip(request: Request) -> str | None:
    """Best-effort client IP extraction, honoring the internal LB header."""
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else None
