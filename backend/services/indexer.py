"""Document ingestion pipeline.

Given a :class:`Document` this module:
1. Chunks the body into ~512-token segments with 50-token overlap.
2. Runs each chunk through Cloud DLP. Chunks that come back empty (fail-closed)
   are dropped and logged.
3. Embeds each safe chunk with Vertex AI.
4. Upserts embeddings + metadata into Pinecone.
5. Writes raw text + metadata into Elasticsearch.

The module exposes a single :func:`index_document` entry point so connectors
(Drive, Slack, Gmail, Jira) can all share the same pipeline.
"""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass

from elasticsearch import Elasticsearch

from ..config import get_settings
from ..models.document import Chunk, Document, DocumentMetadata
from .dlp_scanner import Scanner, build_scanner

logger = logging.getLogger(__name__)

CHUNK_TOKENS = 512
CHUNK_OVERLAP = 50

# Rough heuristic used by the char-count fallback: GPT-style tokenizers
# average ~4 characters per token for English text. This is accurate enough
# for chunk sizing when tiktoken is unavailable (e.g. first run without
# network access so the BPE file hasn't been cached yet).
_APPROX_CHARS_PER_TOKEN = 4

# Cached tiktoken encoder (loaded lazily). The module import MUST NOT touch
# the network — `tiktoken.get_encoding` triggers a blob download the first
# time it runs, and a DNS failure there kills the whole backend on startup.
_ENCODER = None


def _get_encoder():
    """Return the tiktoken encoder, or ``None`` if it can't be loaded.

    The first call may attempt a one-shot download of the BPE vocabulary.
    Any failure (no network, blocked by firewall, etc.) is caught once and
    the caller falls back to :func:`_approximate_chunk_text`.
    """
    global _ENCODER
    if _ENCODER is not None:
        return _ENCODER
    try:
        import tiktoken

        _ENCODER = tiktoken.get_encoding("cl100k_base")
    except Exception as exc:
        logger.warning(
            "tiktoken unavailable (%s) — falling back to char-count "
            "approximation. Token-accurate chunking will resume once the "
            "BPE vocabulary can be downloaded and cached.",
            exc,
        )
        _ENCODER = False  # sentinel: permanently unavailable this process
    return _ENCODER or None


def chunk_text(text: str, size: int = CHUNK_TOKENS, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split ``text`` into overlapping token windows.

    Uses the ``cl100k_base`` tokenizer as a stable proxy for Vertex's
    tokenizer. If tiktoken cannot be loaded (e.g. BPE download blocked),
    falls back to character-count chunking that approximates the same
    window sizes.
    """
    if size <= overlap:
        raise ValueError("size must be greater than overlap")

    encoder = _get_encoder()
    if encoder is None:
        return _approximate_chunk_text(text, size, overlap)

    tokens = encoder.encode(text)
    if not tokens:
        return []

    step = size - overlap
    chunks: list[str] = []
    for start in range(0, len(tokens), step):
        window = tokens[start : start + size]
        if not window:
            break
        chunks.append(encoder.decode(window))
        if start + size >= len(tokens):
            break
    return chunks


def _approximate_chunk_text(text: str, size: int, overlap: int) -> list[str]:
    """Fallback chunker using characters as a stand-in for tokens.

    Only used when tiktoken is unavailable — the chunk boundaries are
    slightly different but the embedding/indexing pipeline is identical.
    """
    if not text:
        return []
    char_size = size * _APPROX_CHARS_PER_TOKEN
    char_overlap = overlap * _APPROX_CHARS_PER_TOKEN
    step = max(1, char_size - char_overlap)
    chunks: list[str] = []
    for start in range(0, len(text), step):
        window = text[start : start + char_size]
        if not window:
            break
        chunks.append(window)
        if start + char_size >= len(text):
            break
    return chunks


@dataclass
class Indexer:
    """Coordinates DLP -> embedder -> vector store + Elasticsearch writes.

    The ``scanner`` is a :class:`Scanner` protocol implementation — typically
    :class:`DLPScanner` in prod or :class:`NoOpScanner` in local development.
    The ``embedder`` and ``pinecone`` fields can be real Vertex / Pinecone
    clients, or local in-memory stand-ins when cloud creds are missing —
    :meth:`default` picks the right pair automatically.
    """

    scanner: Scanner
    embedder: object  # has embed(list[str]) -> list[list[float]]
    pinecone: object  # has .Index(name).upsert(...)/.query(...)
    elasticsearch: Elasticsearch

    @classmethod
    def default(cls) -> Indexer:
        """Build an :class:`Indexer` from environment configuration.

        Falls back to local stand-ins whenever the cloud client can't be
        constructed (empty API key, missing creds, etc.). This lets the full
        upload → search → answer flow work in demos without GCP / Pinecone
        accounts.
        """
        settings = get_settings()
        return cls(
            scanner=build_scanner(),
            embedder=_build_embedder(),
            pinecone=_build_vector_store(),
            elasticsearch=Elasticsearch(
                settings.elasticsearch_url,
                api_key=settings.elasticsearch_api_key or None,
            ),
        )

    def index_document(self, doc: Document) -> int:
        """Chunk, scan, embed, and store a single document.

        Returns the number of chunks that were successfully indexed.
        """
        settings = get_settings()
        texts = chunk_text(doc.body)
        if not texts:
            logger.info("doc %s produced no chunks; skipping", doc.doc_id)
            return 0

        chunks: list[Chunk] = []
        safe_texts: list[str] = []
        for position, raw in enumerate(texts):
            scan = self.scanner.scan(raw)
            if not scan.safe_text:
                logger.warning(
                    "dropping chunk %d of doc %s due to DLP findings=%s",
                    position,
                    doc.doc_id,
                    scan.findings,
                )
                continue

            chunk_id = f"{doc.doc_id}::{position}::{uuid.uuid4().hex[:8]}"
            metadata = DocumentMetadata(
                doc_id=doc.doc_id,
                chunk_id=chunk_id,
                source=doc.source,
                title=doc.title,
                owner_email=doc.owner_email,
                allowed_roles=doc.allowed_roles,
                created_at=doc.created_at,
                last_modified=doc.last_modified,
                url=doc.url,
            )
            chunks.append(
                Chunk(
                    chunk_id=chunk_id,
                    doc_id=doc.doc_id,
                    text=scan.safe_text,
                    position=position,
                    metadata=metadata,
                )
            )
            safe_texts.append(scan.safe_text)

        if not chunks:
            return 0

        try:
            vectors = self.embedder.embed(safe_texts)
        except Exception:
            logger.exception(
                "embed() failed for doc %s; skipping vector upsert", doc.doc_id
            )
            vectors = None

        if vectors is not None:
            try:
                pinecone_index = self.pinecone.Index(settings.pinecone_index)
                pinecone_index.upsert(
                    vectors=[
                        {
                            "id": c.chunk_id,
                            "values": v,
                            "metadata": {
                                "doc_id": c.doc_id,
                                "source": c.metadata.source.value,
                                "title": c.metadata.title,
                                "owner_email": c.metadata.owner_email,
                                "allowed_roles": c.metadata.allowed_roles,
                                "created_at": c.metadata.created_at.isoformat(),
                                "last_modified": c.metadata.last_modified.isoformat(),
                                "url": c.metadata.url or "",
                            },
                        }
                        for c, v in zip(chunks, vectors, strict=True)
                    ]
                )
            except Exception:
                logger.exception(
                    "vector upsert failed for doc %s; continuing with ES-only index",
                    doc.doc_id,
                )

        try:
            self.elasticsearch.bulk(
                operations=[
                    op
                    for c in chunks
                    for op in (
                        {
                            "index": {
                                "_index": settings.elasticsearch_index,
                                "_id": c.chunk_id,
                            }
                        },
                        {
                            "doc_id": c.doc_id,
                            "chunk_id": c.chunk_id,
                            "text": c.text,
                            "title": c.metadata.title,
                            "source": c.metadata.source.value,
                            "owner_email": c.metadata.owner_email,
                            "allowed_roles": c.metadata.allowed_roles,
                            "created_at": c.metadata.created_at.isoformat(),
                            "last_modified": c.metadata.last_modified.isoformat(),
                            "url": c.metadata.url,
                        },
                    )
                ],
                refresh="wait_for",
            )
        except Exception:
            logger.exception(
                "Elasticsearch bulk write failed for doc %s", doc.doc_id
            )
            # If both stores failed we have nothing — report zero chunks.
            if vectors is None:
                return 0

        logger.info("indexed %d chunks for doc %s", len(chunks), doc.doc_id)
        return len(chunks)


# ---------------------------------------------------------------------------
# Factory helpers — pick real client or local stand-in based on creds.
# ---------------------------------------------------------------------------


def _build_embedder():
    """Return a Vertex ``Embedder`` when creds exist, else :class:`LocalEmbedder`."""
    settings = get_settings()
    # If no GCP project is configured we're clearly in local mode.
    if not settings.gcp_project_id:
        from .local_embedder import LocalEmbedder

        logger.info("embedder: using LocalEmbedder (no GCP_PROJECT_ID set)")
        return LocalEmbedder()
    try:
        from .embedder import Embedder

        emb = Embedder()
        logger.info("embedder: using Vertex AI %s", settings.vertex_embedding_model)
        return emb
    except Exception as exc:
        from .local_embedder import LocalEmbedder

        logger.warning(
            "embedder: Vertex init failed (%s); falling back to LocalEmbedder", exc
        )
        return LocalEmbedder()


def _build_vector_store():
    """Return a Pinecone client when configured, else :class:`LocalPineconeStub`."""
    settings = get_settings()
    if not settings.pinecone_api_key:
        from .local_vector_store import LocalPineconeStub

        logger.info("vector store: using LocalPineconeStub (no PINECONE_API_KEY)")
        return LocalPineconeStub()
    try:
        from pinecone import Pinecone

        logger.info("vector store: using Pinecone index=%s", settings.pinecone_index)
        return Pinecone(api_key=settings.pinecone_api_key)
    except Exception as exc:
        from .local_vector_store import LocalPineconeStub

        logger.warning(
            "vector store: Pinecone init failed (%s); falling back to local", exc
        )
        return LocalPineconeStub()
