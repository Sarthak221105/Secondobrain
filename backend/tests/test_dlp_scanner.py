"""Unit tests for :mod:`backend.services.dlp_scanner`."""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import MagicMock

from backend.services.dlp_scanner import DLPScanner, ScanResult


def _fake_finding(name: str) -> SimpleNamespace:
    return SimpleNamespace(info_type=SimpleNamespace(name=name))


def _fake_inspect_response(findings):
    return SimpleNamespace(result=SimpleNamespace(findings=findings))


def _fake_deidentify_response(text: str):
    return SimpleNamespace(item=SimpleNamespace(value=text))


class TestScan:
    def test_empty_text_returns_unchanged(self):
        client = MagicMock()
        scanner = DLPScanner(client=client)
        result = scanner.scan("")
        assert isinstance(result, ScanResult)
        assert result.safe_text == ""
        assert not result.had_sensitive_data
        client.inspect_content.assert_not_called()

    def test_whitespace_only_text_is_skipped(self):
        client = MagicMock()
        scanner = DLPScanner(client=client)
        result = scanner.scan("   \n\t  ")
        assert result.safe_text.strip() == ""
        client.inspect_content.assert_not_called()

    def test_no_findings_returns_original_text(self):
        client = MagicMock()
        client.inspect_content.return_value = _fake_inspect_response([])
        scanner = DLPScanner(client=client)

        result = scanner.scan("the quick brown fox")

        assert result.safe_text == "the quick brown fox"
        assert not result.had_sensitive_data
        assert not result.redacted
        client.deidentify_content.assert_not_called()

    def test_findings_trigger_deidentify(self):
        client = MagicMock()
        client.inspect_content.return_value = _fake_inspect_response(
            [_fake_finding("EMAIL_ADDRESS"), _fake_finding("PHONE_NUMBER")]
        )
        client.deidentify_content.return_value = _fake_deidentify_response(
            "contact [EMAIL_ADDRESS] or [PHONE_NUMBER]"
        )
        scanner = DLPScanner(client=client)

        result = scanner.scan("contact alice@example.com or 555-1212")

        assert result.redacted
        assert result.had_sensitive_data
        assert "[EMAIL_ADDRESS]" in result.safe_text
        assert set(result.findings) == {"EMAIL_ADDRESS", "PHONE_NUMBER"}

    def test_inspect_error_fails_closed(self):
        client = MagicMock()
        client.inspect_content.side_effect = RuntimeError("boom")
        scanner = DLPScanner(client=client)

        result = scanner.scan("some text")

        assert result.safe_text == ""
        assert result.redacted
        assert "DLP_ERROR" in result.findings

    def test_deidentify_error_fails_closed(self):
        client = MagicMock()
        client.inspect_content.return_value = _fake_inspect_response(
            [_fake_finding("CREDIT_CARD_NUMBER")]
        )
        client.deidentify_content.side_effect = RuntimeError("boom")
        scanner = DLPScanner(client=client)

        result = scanner.scan("card: 4111 1111 1111 1111")
        assert result.safe_text == ""
        assert result.redacted
        assert "CREDIT_CARD_NUMBER" in result.findings
