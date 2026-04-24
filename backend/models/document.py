"""Document, chunk, and search-result models."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class Source(str, Enum):
    """Upstream system a document was ingested from."""

    GOOGLE_DRIVE = "google_drive"
    SLACK = "slack"
    GMAIL = "gmail"
    JIRA = "jira"
    UPLOAD = "upload"


class DocumentMetadata(BaseModel):
    """Metadata attached to every indexed chunk."""

    doc_id: str
    chunk_id: str
    source: Source
    title: str
    owner_email: EmailStr
    allowed_roles: list[str] = Field(default_factory=list)
    created_at: datetime
    last_modified: datetime
    url: str | None = None


class Document(BaseModel):
    """A document prior to chunking."""

    doc_id: str
    source: Source
    title: str
    body: str
    owner_email: EmailStr
    allowed_roles: list[str]
    created_at: datetime
    last_modified: datetime
    url: str | None = None


class Chunk(BaseModel):
    """A single chunk of a document."""

    chunk_id: str
    doc_id: str
    text: str
    position: int
    metadata: DocumentMetadata


class SearchResult(BaseModel):
    """A single search hit returned to the client."""

    doc_id: str
    chunk_id: str
    title: str
    snippet: str
    source: Source
    owner_email: EmailStr
    last_modified: datetime
    relevance_score: float
    allowed_roles: list[str]
    url: str | None = None


class SearchRequest(BaseModel):
    """Incoming search query payload."""

    query: str = Field(..., min_length=1, max_length=1024)
    top_k: int = 10
    include_answer: bool = True


class SearchResponse(BaseModel):
    """Non-streaming search response (answer streamed separately)."""

    query: str
    results: list[SearchResult]
    took_ms: int
    answer: str | None = None
    mode: Literal["hybrid", "semantic", "keyword"] = "hybrid"
