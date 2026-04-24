"""Deterministic local embedder — used when Vertex AI isn't configured.

Produces 768-dimensional vectors from text using a hashed bag-of-ngrams.
This is **not** semantically meaningful the way ``text-embedding-004`` is;
it's good enough for the local demo because:

* Identical texts always embed identically → upsert/query works.
* Texts sharing many word n-grams produce similar vectors → semi-plausible
  ranking for simple queries.
* Unrelated texts produce near-orthogonal vectors → low false positives.

In production, :class:`Embedder` from ``services.embedder`` wraps Vertex AI
instead. The two are interface-compatible: both expose ``embed`` and
``embed_query``.
"""

from __future__ import annotations

import hashlib
import math
import re
from collections.abc import Sequence

_DIM = 768
_NGRAM_SIZES = (1, 2, 3)

_token_re = re.compile(r"[A-Za-z0-9]+")


class LocalEmbedder:
    """Hashed n-gram embedder with an interface identical to :class:`Embedder`."""

    def __init__(self, dim: int = _DIM) -> None:
        """Pick the vector dimension. Default matches text-embedding-004 (768)."""
        self._dim = dim

    def embed(
        self, texts: Sequence[str], task_type: str = "RETRIEVAL_DOCUMENT"
    ) -> list[list[float]]:
        """Return one vector per input text."""
        return [self._embed_one(t) for t in texts]

    def embed_query(self, text: str) -> list[float]:
        """Embed a single search query."""
        return self._embed_one(text)

    def _embed_one(self, text: str) -> list[float]:
        """Hash n-grams into a fixed-dimension vector, then L2-normalize."""
        vec = [0.0] * self._dim
        tokens = [t.lower() for t in _token_re.findall(text)]
        if not tokens:
            return vec
        for n in _NGRAM_SIZES:
            if len(tokens) < n:
                continue
            for i in range(len(tokens) - n + 1):
                gram = " ".join(tokens[i : i + n])
                h = hashlib.blake2b(gram.encode("utf-8"), digest_size=8).digest()
                idx = int.from_bytes(h[:4], "big") % self._dim
                sign = 1.0 if (h[4] & 1) else -1.0
                vec[idx] += sign
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [x / norm for x in vec]
        return vec
