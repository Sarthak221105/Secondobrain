"""Hybrid search — semantic (Pinecone) + keyword (Elasticsearch) + RRF merge.

The heavy lifting lives here so the router in :mod:`backend.routers.search`
stays thin. The permission filter is deliberately *not* applied at this layer;
callers are required to apply it on the merged list (this keeps the ranking
logic separate from authorization logic).
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass

from elasticsearch import AsyncElasticsearch

from ..config import get_settings
from ..models.document import SearchResult, Source
from .indexer import _build_embedder, _build_vector_store

logger = logging.getLogger(__name__)

RRF_K = 60  # standard RRF constant


@dataclass
class _RankedHit:
    """Intermediate representation while merging the two rankings."""

    chunk_id: str
    score: float
    payload: dict


class HybridSearcher:
    """Coordinates Pinecone + Elasticsearch queries and the RRF merge.

    Both sides are wrapped in try/except so one failing source never takes
    the whole query down — you still get results from the healthy side.
    """

    def __init__(
        self,
        embedder,
        pinecone,
        elasticsearch: AsyncElasticsearch,
    ) -> None:
        """Store handles; no network calls happen at construction time."""
        self._embedder = embedder
        self._pinecone = pinecone
        self._es = elasticsearch
        self._settings = get_settings()

    @classmethod
    def default(cls) -> HybridSearcher:
        """Build a searcher from environment configuration."""
        settings = get_settings()
        return cls(
            embedder=_build_embedder(),
            pinecone=_build_vector_store(),
            elasticsearch=AsyncElasticsearch(
                settings.elasticsearch_url,
                api_key=settings.elasticsearch_api_key or None,
            ),
        )

    async def search(self, query: str, top_k: int = 50) -> list[SearchResult]:
        """Run both searches in parallel, merge via RRF, return top-``top_k``."""
        semantic_task = asyncio.create_task(self._semantic_safe(query, top_k))
        keyword_task = asyncio.create_task(self._keyword_safe(query, top_k))
        semantic, keyword = await asyncio.gather(semantic_task, keyword_task)

        merged = reciprocal_rank_fusion([semantic, keyword])
        return [_to_result(hit) for hit in merged[:top_k]]

    async def _semantic_safe(self, query: str, top_k: int) -> list[_RankedHit]:
        """Run semantic retrieval, returning ``[]`` on any failure."""
        try:
            return await self._semantic(query, top_k)
        except Exception:
            logger.exception("semantic search failed; continuing without it")
            return []

    async def _keyword_safe(self, query: str, top_k: int) -> list[_RankedHit]:
        """Run keyword retrieval, returning ``[]`` on any failure."""
        try:
            return await self._keyword(query, top_k)
        except Exception:
            logger.exception("keyword search failed; continuing without it")
            return []

    async def _semantic(self, query: str, top_k: int) -> list[_RankedHit]:
        """Vector-store semantic query (Pinecone or local stand-in)."""
        loop = asyncio.get_running_loop()
        vec = await loop.run_in_executor(None, self._embedder.embed_query, query)
        index = self._pinecone.Index(self._settings.pinecone_index)
        resp = await loop.run_in_executor(
            None,
            lambda: index.query(
                vector=vec, top_k=top_k, include_metadata=True, include_values=False
            ),
        )
        matches = resp.get("matches", []) if isinstance(resp, dict) else resp.matches
        hits: list[_RankedHit] = []
        for m in matches:
            md = dict(m.get("metadata") or {}) if isinstance(m, dict) else dict(
                getattr(m, "metadata", None) or {}
            )
            chunk_id = m.get("id", "") if isinstance(m, dict) else getattr(m, "id", "")
            score = (
                float(m.get("score", 0.0))
                if isinstance(m, dict)
                else float(getattr(m, "score", 0.0))
            )
            hits.append(_RankedHit(chunk_id=chunk_id, score=score, payload=md))
        return hits

    async def _keyword(self, query: str, top_k: int) -> list[_RankedHit]:
        """Elasticsearch full-text query."""
        resp = await self._es.search(
            index=self._settings.elasticsearch_index,
            query={
                "multi_match": {
                    "query": query,
                    "fields": ["title^2", "text"],
                    "type": "best_fields",
                }
            },
            size=top_k,
            _source=True,
            highlight={"fields": {"text": {"fragment_size": 200, "number_of_fragments": 1}}},
            ignore_unavailable=True,
            allow_no_indices=True,
        )
        hits: list[_RankedHit] = []
        for h in resp["hits"]["hits"]:
            src = dict(h.get("_source") or {})
            hl = h.get("highlight", {}).get("text")
            if hl:
                src["snippet"] = hl[0]
            hits.append(
                _RankedHit(
                    chunk_id=h["_id"],
                    score=float(h.get("_score") or 0.0),
                    payload=src,
                )
            )
        return hits


def reciprocal_rank_fusion(rankings: list[list[_RankedHit]]) -> list[_RankedHit]:
    """Classic RRF: score = sum(1 / (k + rank)) over all rankings."""
    scores: dict[str, float] = {}
    payloads: dict[str, dict] = {}
    for ranking in rankings:
        for rank, hit in enumerate(ranking):
            scores[hit.chunk_id] = scores.get(hit.chunk_id, 0.0) + 1.0 / (
                RRF_K + rank + 1
            )
            # Prefer the payload with the most fields; keyword hits often have
            # ``text`` / ``snippet`` that Pinecone does not.
            if hit.chunk_id not in payloads or len(hit.payload) > len(
                payloads[hit.chunk_id]
            ):
                payloads[hit.chunk_id] = hit.payload

    merged = [
        _RankedHit(chunk_id=cid, score=score, payload=payloads[cid])
        for cid, score in scores.items()
    ]
    merged.sort(key=lambda h: h.score, reverse=True)
    return merged


def _to_result(hit: _RankedHit) -> SearchResult:
    """Convert an internal ranked hit into the API model."""
    p = hit.payload
    snippet = p.get("snippet") or (p.get("text", "")[:240])
    return SearchResult(
        doc_id=p.get("doc_id", hit.chunk_id.split("::")[0]),
        chunk_id=hit.chunk_id,
        title=p.get("title", "(untitled)"),
        snippet=snippet,
        source=Source(p.get("source", Source.GOOGLE_DRIVE.value)),
        owner_email=p.get("owner_email", "unknown@example.com"),
        last_modified=p.get("last_modified") or p.get("created_at") or "1970-01-01T00:00:00+00:00",
        relevance_score=hit.score,
        allowed_roles=list(p.get("allowed_roles") or []),
        url=p.get("url") or None,
    )
