"""Unit tests for :mod:`backend.services.rag`."""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from backend.services.rag import RAGGenerator, build_prompt

from .conftest import make_result


class TestBuildPrompt:
    def test_empty_results_yields_no_context_marker(self):
        prompt = build_prompt("what is the Q4 revenue?", [])
        assert "no documents available" in prompt
        assert "what is the Q4 revenue?" in prompt

    def test_numbered_citations_in_prompt(self):
        results = [
            make_result(chunk_id="a", title="Q4 Report"),
            make_result(chunk_id="b", title="Investor Memo"),
        ]
        prompt = build_prompt("revenue", results)
        assert "[1]" in prompt and "[2]" in prompt
        assert "Q4 Report" in prompt
        assert "Investor Memo" in prompt

    def test_only_first_three_results_needed(self):
        # build_prompt itself renders all supplied — the caller truncates to 3.
        results = [make_result(chunk_id=f"c{i}", title=f"Doc {i}") for i in range(5)]
        prompt = build_prompt("q", results)
        for i in range(5):
            assert f"Doc {i}" in prompt


class TestGenerate:
    def test_truncates_to_top_three(self):
        model = MagicMock()
        model.generate_content.return_value = SimpleNamespace(text="a brief answer")
        rag = RAGGenerator(model=model)
        results = [make_result(chunk_id=f"c{i}", title=f"Doc {i}") for i in range(10)]

        out = rag.generate("q", results)

        assert out == "a brief answer"
        prompt_arg = model.generate_content.call_args.args[0]
        # Top 3 should appear, Doc 3+ should not.
        assert "Doc 0" in prompt_arg and "Doc 1" in prompt_arg and "Doc 2" in prompt_arg
        assert "Doc 3" not in prompt_arg

    def test_generation_config_is_conservative(self):
        model = MagicMock()
        model.generate_content.return_value = SimpleNamespace(text="x")
        rag = RAGGenerator(model=model)
        rag.generate("q", [make_result()])

        cfg = model.generate_content.call_args.kwargs["generation_config"]
        # Conservative temperature keeps the RAG answer grounded.
        assert cfg.temperature <= 0.3
        assert cfg.max_output_tokens <= 512

    def test_empty_results_still_queries_model(self):
        model = MagicMock()
        model.generate_content.return_value = SimpleNamespace(text="no answer")
        rag = RAGGenerator(model=model)
        out = rag.generate("q", [])
        assert out == "no answer"
        # The prompt should contain the no-context marker.
        prompt_arg = model.generate_content.call_args.args[0]
        assert "no documents available" in prompt_arg


@pytest.mark.asyncio
class TestStream:
    async def test_stream_yields_tokens(self):
        class FakeEvent:
            def __init__(self, text: str) -> None:
                self.text = text

        class FakeStream:
            def __init__(self, events):
                self._events = events

            def __aiter__(self):
                self._iter = iter(self._events)
                return self

            async def __anext__(self):
                try:
                    return next(self._iter)
                except StopIteration:
                    raise StopAsyncIteration

        async def fake_stream(*a, **kw):
            return FakeStream([FakeEvent("hello "), FakeEvent("world")])

        model = MagicMock()
        model.generate_content_async = fake_stream
        rag = RAGGenerator(model=model)

        tokens = [t async for t in rag.stream("q", [make_result()])]
        assert tokens == ["hello ", "world"]
