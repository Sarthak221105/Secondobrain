"""RAG answer generation via Gemini on Vertex AI.

Takes the top permission-filtered results and asks Gemini for a short,
grounded answer. The prompt is constrained to discourage hallucination:

* The model is told to cite the provided sources by title.
* If the context does not contain the answer, it must say so.
* Output is streamed back to the frontend for responsiveness.

When Gemini cannot be reached (no Vertex creds, offline, or model init
fails) the generator transparently falls back to an extractive answer —
just a short blurb citing the top sources. The streaming interface is
preserved either way.
"""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator

from ..config import get_settings
from ..models.document import SearchResult

logger = logging.getLogger(__name__)

_SYSTEM_INSTRUCTION = (
    "You are an internal enterprise search assistant. Answer only from the "
    "provided context. Cite sources inline as [Title]. If the context does not "
    "contain the answer, reply with exactly: "
    "'I could not find that in the available documents.' "
    "Keep the answer to 2-3 sentences."
)


def build_prompt(query: str, results: list[SearchResult]) -> str:
    """Render the user-facing prompt sent to Gemini."""
    if not results:
        return (
            f"Query: {query}\n\n"
            "Context: (no documents available)\n\n"
            "Answer:"
        )

    context_blocks = []
    for idx, r in enumerate(results, start=1):
        context_blocks.append(
            f"[{idx}] Title: {r.title}\n"
            f"    Source: {r.source.value}\n"
            f"    Owner: {r.owner_email}\n"
            f"    Content: {r.snippet}"
        )
    context = "\n\n".join(context_blocks)
    return f"Query: {query}\n\nContext:\n{context}\n\nAnswer:"


class RAGGenerator:
    """Wraps a Gemini model, with a transparent extractive fallback."""

    def __init__(self, model=None) -> None:
        """Instantiate the configured generative model or accept an override.

        Construction never raises — if Vertex can't be initialized we keep
        ``self._model = None`` and switch to an extractive answer. Callers
        don't need to know which backend is active.
        """
        if model is None:
            settings = get_settings()
            if not settings.gcp_project_id:
                logger.info("RAG: no GCP project; using extractive fallback")
                self._model = None
                return
            try:
                from vertexai.generative_models import GenerativeModel

                model = GenerativeModel(
                    settings.vertex_generation_model,
                    system_instruction=_SYSTEM_INSTRUCTION,
                )
                logger.info("RAG: using Vertex %s", settings.vertex_generation_model)
            except Exception as exc:
                logger.warning("RAG: Gemini unavailable (%s); using extractive fallback", exc)
                model = None
        self._model = model

    @property
    def backend(self) -> str:
        """Return ``"gemini"`` or ``"extractive"`` for diagnostics."""
        return "gemini" if self._model is not None else "extractive"

    def generate(self, query: str, results: list[SearchResult]) -> str:
        """Return a non-streamed answer. Useful for tests and background jobs."""
        top = results[:3]
        if self._model is None:
            return _extractive_answer(query, top)

        try:
            from vertexai.generative_models import GenerationConfig

            prompt = build_prompt(query, top)
            resp = self._model.generate_content(
                prompt,
                generation_config=GenerationConfig(
                    temperature=0.2, max_output_tokens=256, top_p=0.9
                ),
            )
            return (resp.text or "").strip()
        except Exception:
            logger.exception("Gemini generate failed; using extractive fallback")
            return _extractive_answer(query, top)

    async def stream(
        self, query: str, results: list[SearchResult]
    ) -> AsyncIterator[str]:
        """Yield answer tokens. Falls back to a single-shot extractive reply."""
        top = results[:3]
        if self._model is None:
            yield _extractive_answer(query, top)
            return

        try:
            from vertexai.generative_models import GenerationConfig

            prompt = build_prompt(query, top)
            stream = await self._model.generate_content_async(
                prompt,
                generation_config=GenerationConfig(
                    temperature=0.2, max_output_tokens=256, top_p=0.9
                ),
                stream=True,
            )
            async for event in stream:
                if event.text:
                    yield event.text
        except Exception:
            logger.exception("Gemini stream failed; using extractive fallback")
            yield _extractive_answer(query, top)


def _extractive_answer(query: str, results: list[SearchResult]) -> str:
    """Build a short, template-based answer from the top results.

    Used when Gemini isn't configured — not an LLM response, just a
    readable summary so the UI has something to display.
    """
    if not results:
        return "I could not find that in the available documents."

    citations = ", ".join(f"[{r.title}]" for r in results)
    head = (results[0].snippet or "").strip()
    if len(head) > 220:
        head = head[:220].rsplit(" ", 1)[0] + "…"
    return (
        f"Based on the indexed documents, the most relevant excerpt for "
        f"\"{query}\" is: {head} (sources: {citations}). "
        f"Enable Gemini (set GCP_PROJECT_ID and Vertex credentials) for "
        f"a synthesized answer."
    )
