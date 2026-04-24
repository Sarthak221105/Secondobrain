"""FastAPI entrypoint for the Enterprise Search backend."""

from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import get_settings
from .routers import admin, auth, search, waitlist

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)

settings = get_settings()

_startup_logger = logging.getLogger("enterprise-search.startup")
_startup_logger.warning(
    "booting | AUTH_ENABLED=%s | DLP_ENABLED=%s | cors_origins=%s",
    settings.auth_enabled,
    settings.dlp_enabled,
    settings.cors_origins,
)
if not settings.auth_enabled:
    _startup_logger.warning(
        "AUTH IS DISABLED — backend is accepting X-Dev-Role header without "
        "Firebase verification. DO NOT run this configuration in production."
    )

app = FastAPI(
    title="Enterprise Search",
    version="0.1.0",
    description="Private, permission-aware enterprise search over internal data.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(search.router)
app.include_router(admin.router)
app.include_router(waitlist.router)


# ---------------------------------------------------------------------------
# Global exception handlers. Without these, an uncaught exception causes
# Starlette to return a plain 500 that may not carry CORS headers, and the
# browser surfaces the failure as "Failed to fetch" with no detail. These
# handlers guarantee a JSON body + a clear status code every time.
# ---------------------------------------------------------------------------


_err_logger = logging.getLogger("enterprise-search.errors")


@app.exception_handler(Exception)
async def _handle_unexpected(_request: Request, exc: Exception) -> JSONResponse:
    """Return a structured 500 for any uncaught exception."""
    _err_logger.exception("unhandled exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": f"{type(exc).__name__}: {exc}"},
    )


@app.exception_handler(RequestValidationError)
async def _handle_validation(
    _request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Return a readable 422 for FastAPI validation errors."""
    return JSONResponse(status_code=422, content={"detail": exc.errors()})


@app.get("/healthz", tags=["health"])
async def healthz() -> dict:
    """Liveness probe. Reports feature availability too.

    The ``parsers`` block tells you whether PDF / DOCX uploads will work —
    those libs are imported lazily so the backend boots even if the image
    wasn't rebuilt after adding them.
    """
    parsers = {}
    try:
        import pypdf  # noqa: F401

        parsers["pdf"] = True
    except ImportError:
        parsers["pdf"] = False
    try:
        import docx  # noqa: F401

        parsers["docx"] = True
    except ImportError:
        parsers["docx"] = False
    return {
        "status": "ok",
        "auth_enabled": settings.auth_enabled,
        "dlp_enabled": settings.dlp_enabled,
        "parsers": parsers,
        "backends": {
            "vector_store": "pinecone" if settings.pinecone_api_key else "local",
            "embedder": "vertex" if settings.gcp_project_id else "local",
            "rag": "gemini" if settings.gcp_project_id else "extractive",
        },
    }
