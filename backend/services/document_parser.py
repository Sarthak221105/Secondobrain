"""Text extraction for admin-uploaded files.

Supports PDF, DOCX, and any plain-text-ish file (txt / md / log / csv).
Anything else raises :class:`UnsupportedFileType` so the router can return a
per-file ``skipped`` status instead of a 500.

A 25 MB per-file cap guards against runaway memory use — the PDF and DOCX
parsers both load the whole file into memory.
"""

from __future__ import annotations

import logging
from io import BytesIO

logger = logging.getLogger(__name__)

MAX_FILE_BYTES = 25 * 1024 * 1024  # 25 MB

_TEXT_EXTENSIONS = frozenset({"txt", "md", "log", "csv"})


class UnsupportedFileType(ValueError):
    """Raised when the uploader sends a file we cannot parse."""


def extract_text(filename: str, data: bytes) -> str:
    """Return the plain-text content of ``data``.

    ``filename`` is used only for extension dispatch — the bytes are the
    authoritative input. Raises :class:`UnsupportedFileType` for unknown
    extensions, oversized files, or files whose extension doesn't match
    their real shape (e.g. a corrupt PDF).
    """
    if len(data) > MAX_FILE_BYTES:
        raise UnsupportedFileType(
            f"file too large ({len(data)} bytes, cap is {MAX_FILE_BYTES})"
        )

    ext = _extension(filename)
    if ext == "pdf":
        return _extract_pdf(data)
    if ext == "docx":
        return _extract_docx(data)
    if ext in _TEXT_EXTENSIONS:
        return data.decode("utf-8", errors="replace")

    raise UnsupportedFileType(f"cannot parse .{ext} files")


def _extension(filename: str) -> str:
    """Return the lowercased extension, or ``""`` if the filename has none."""
    if "." not in filename:
        return ""
    return filename.rsplit(".", 1)[-1].lower().strip()


def _extract_pdf(data: bytes) -> str:
    """Extract text from a PDF, page by page, and join with blank lines.

    Scan-only (image) PDFs will return an empty string — the indexer already
    handles that by producing zero chunks.
    """
    try:
        import pypdf  # lazy: keep the backend bootable without the lib
    except ImportError as exc:
        raise UnsupportedFileType(
            "pypdf is not installed — rebuild the backend image"
        ) from exc

    try:
        reader = pypdf.PdfReader(BytesIO(data))
    except Exception as exc:  # pypdf raises many flavors of exception
        raise UnsupportedFileType(f"could not open PDF: {exc}") from exc

    pages: list[str] = []
    for page in reader.pages:
        try:
            pages.append(page.extract_text() or "")
        except Exception:
            logger.warning("failed to extract a PDF page; continuing", exc_info=True)
            pages.append("")
    return "\n\n".join(p.strip() for p in pages if p.strip())


def _extract_docx(data: bytes) -> str:
    """Extract text from a .docx, joining paragraphs with newlines."""
    try:
        import docx  # lazy: keep the backend bootable without python-docx
    except ImportError as exc:
        raise UnsupportedFileType(
            "python-docx is not installed — rebuild the backend image"
        ) from exc

    try:
        doc = docx.Document(BytesIO(data))
    except Exception as exc:
        raise UnsupportedFileType(f"could not open DOCX: {exc}") from exc

    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())
