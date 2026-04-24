"""Cloud DLP scanning and redaction.

Every chunk is scanned **before** it is embedded and written to Pinecone /
Elasticsearch. If PII or secrets are detected the chunk is de-identified using
the configured deidentify template. A warning is logged with the detected
info-types so the security team can investigate the upstream source.

If DLP is unavailable (for example in local development) the scanner falls back
to refusing to index the chunk rather than silently leaking data. This is a
fail-closed default — see :class:`ScanResult`.

For local development without DLP credentials, set ``DLP_ENABLED=false`` (the
default) and :func:`build_scanner` returns a :class:`NoOpScanner` which
pass-through-indexes every chunk and logs a loud warning. **Never enable this
in production.**
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Protocol

try:  # google-cloud-dlp is optional when DLP_ENABLED=false.
    from google.cloud import dlp_v2
except ImportError:  # pragma: no cover - import only fails in minimal envs
    dlp_v2 = None  # type: ignore[assignment]

from ..config import get_settings

logger = logging.getLogger(__name__)

# Info-types we always want DLP to look for in addition to the template.
_DEFAULT_INFO_TYPES = [
    "EMAIL_ADDRESS",
    "PHONE_NUMBER",
    "CREDIT_CARD_NUMBER",
    "US_SOCIAL_SECURITY_NUMBER",
    "GCP_CREDENTIALS",
    "GCP_API_KEY",
    "AWS_CREDENTIALS",
    "ENCRYPTION_KEY",
    "PASSWORD",
]


@dataclass
class ScanResult:
    """Outcome of a DLP scan for a single chunk."""

    safe_text: str
    findings: list[str] = field(default_factory=list)
    redacted: bool = False

    @property
    def had_sensitive_data(self) -> bool:
        """Whether any sensitive info-types were detected."""
        return bool(self.findings)


class Scanner(Protocol):
    """Minimal scanner interface used by the indexer."""

    def scan(self, text: str) -> ScanResult: ...


class DLPScanner:
    """Scans and de-identifies text via Cloud DLP.

    Accepts an optional pre-built client so unit tests can inject a mock.
    """

    def __init__(self, client: "dlp_v2.DlpServiceClient | None" = None) -> None:
        """Build or accept a DLP client and cache the configured parent."""
        self._settings = get_settings()
        if client is None:
            if dlp_v2 is None:
                raise RuntimeError(
                    "google-cloud-dlp is not installed but DLPScanner was "
                    "constructed. Install it or set DLP_ENABLED=false."
                )
            client = dlp_v2.DlpServiceClient()
        self._client = client
        self._parent = f"projects/{self._settings.gcp_project_id}/locations/global"

    def scan(self, text: str) -> ScanResult:
        """Scan ``text`` and return a :class:`ScanResult`.

        On any DLP error we fail closed — the returned ``safe_text`` is empty
        and ``redacted`` is True so the caller can skip indexing.
        """
        if not text.strip():
            return ScanResult(safe_text=text)

        inspect_config = {
            "info_types": [{"name": t} for t in _DEFAULT_INFO_TYPES],
            "include_quote": False,
            "min_likelihood": dlp_v2.Likelihood.POSSIBLE,
        }

        item = {"value": text}

        try:
            inspect_resp = self._client.inspect_content(
                request={
                    "parent": self._parent,
                    "inspect_template_name": self._settings.dlp_inspect_template
                    or None,
                    "inspect_config": inspect_config,
                    "item": item,
                }
            )
        except Exception:
            logger.exception("DLP inspect failed — failing closed on this chunk")
            return ScanResult(safe_text="", findings=["DLP_ERROR"], redacted=True)

        findings = [f.info_type.name for f in inspect_resp.result.findings]
        if not findings:
            return ScanResult(safe_text=text)

        logger.warning("DLP findings on chunk: %s", findings)

        try:
            deid_resp = self._client.deidentify_content(
                request={
                    "parent": self._parent,
                    "deidentify_template_name": self._settings.dlp_deidentify_template
                    or None,
                    "inspect_config": inspect_config,
                    "deidentify_config": _default_deidentify_config(),
                    "item": item,
                }
            )
            return ScanResult(
                safe_text=deid_resp.item.value, findings=findings, redacted=True
            )
        except Exception:
            logger.exception("DLP deidentify failed — failing closed on this chunk")
            return ScanResult(safe_text="", findings=findings, redacted=True)


def _default_deidentify_config() -> dict:
    """Default redaction config: replace every finding with its info-type."""
    return {
        "info_type_transformations": {
            "transformations": [
                {
                    "primitive_transformation": {
                        "replace_with_info_type_config": {}
                    }
                }
            ]
        }
    }


class NoOpScanner:
    """Pass-through scanner used when ``DLP_ENABLED=false``.

    Every call returns the input text unchanged. A warning is logged once per
    process so it cannot accidentally reach production undetected.
    """

    _warned = False

    def __init__(self) -> None:
        """Emit a single loud warning on first construction."""
        if not NoOpScanner._warned:
            logger.warning(
                "DLP is DISABLED (DLP_ENABLED=false). Chunks will be indexed "
                "without PII scanning. Do NOT run this configuration in production."
            )
            NoOpScanner._warned = True

    def scan(self, text: str) -> ScanResult:
        """Return the text as-is, flagged as neither redacted nor scanned."""
        return ScanResult(safe_text=text)


def build_scanner() -> Scanner:
    """Return :class:`DLPScanner` if DLP is enabled, else :class:`NoOpScanner`.

    This is the only place the indexer should construct a scanner. It keeps
    the enable/disable decision in one spot and lets prod deployments flip
    the switch with a single env var.
    """
    if get_settings().dlp_enabled:
        return DLPScanner()
    return NoOpScanner()
