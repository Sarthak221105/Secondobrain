"""Vertex AI embedding client.

Wraps ``text-embedding-004`` so the rest of the backend does not have to think
about Vertex-specific request shapes. Batches to the provider's max batch size
(250 at time of writing) and retries on transient errors.
"""

from __future__ import annotations

import logging
from collections.abc import Sequence

from google.api_core.exceptions import GoogleAPICallError, RetryError
from vertexai.language_models import TextEmbeddingInput, TextEmbeddingModel

from ..config import get_settings

logger = logging.getLogger(__name__)

_BATCH = 250


class Embedder:
    """Thin wrapper around a Vertex ``TextEmbeddingModel``."""

    def __init__(self, model: TextEmbeddingModel | None = None) -> None:
        """Load the configured embedding model, or use the provided one."""
        if model is None:
            settings = get_settings()
            model = TextEmbeddingModel.from_pretrained(settings.vertex_embedding_model)
        self._model = model

    def embed(
        self, texts: Sequence[str], task_type: str = "RETRIEVAL_DOCUMENT"
    ) -> list[list[float]]:
        """Return an embedding vector for each input text.

        ``task_type`` should be ``RETRIEVAL_DOCUMENT`` when indexing and
        ``RETRIEVAL_QUERY`` when embedding a user's query.
        """
        if not texts:
            return []

        vectors: list[list[float]] = []
        for i in range(0, len(texts), _BATCH):
            chunk = texts[i : i + _BATCH]
            inputs = [TextEmbeddingInput(text=t, task_type=task_type) for t in chunk]
            try:
                resp = self._model.get_embeddings(inputs)
            except (GoogleAPICallError, RetryError):
                logger.exception("Vertex embedding call failed")
                raise
            vectors.extend(e.values for e in resp)
        return vectors

    def embed_query(self, text: str) -> list[float]:
        """Embed a single search query."""
        return self.embed([text], task_type="RETRIEVAL_QUERY")[0]
