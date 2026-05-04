"""Environment-backed configuration for the backend.

All secrets and project-specific identifiers are loaded from environment
variables. Never hardcode anything that varies between deployments.
"""

from __future__ import annotations

import os
from functools import lru_cache

from pydantic import BaseModel


class Settings(BaseModel):
    """Runtime configuration pulled from environment variables."""

    # GCP
    gcp_project_id: str = os.getenv("GCP_PROJECT_ID", "")
    gcp_region: str = os.getenv("GCP_REGION", "us-central1")

    # Auth.
    # Set AUTH_ENABLED=false to skip Firebase JWT verification and let the
    # frontend pick a role via the X-Dev-Role header. Never run this in prod.
    auth_enabled: bool = os.getenv("AUTH_ENABLED", "true").lower() in (
        "1",
        "true",
        "yes",
        "on",
    )

    # Firebase
    firebase_project_id: str = os.getenv("FIREBASE_PROJECT_ID", "")
    firebase_credentials_path: str = os.getenv("FIREBASE_CREDENTIALS_PATH", "")

    # Vertex AI
    vertex_embedding_model: str = os.getenv(
        "VERTEX_EMBEDDING_MODEL", "text-embedding-004"
    )
    vertex_generation_model: str = os.getenv(
        "VERTEX_GENERATION_MODEL", "gemini-1.5-pro"
    )

    # Pinecone
    pinecone_api_key: str = os.getenv("PINECONE_API_KEY", "")
    pinecone_index: str = os.getenv("PINECONE_INDEX", "enterprise-search")
    pinecone_environment: str = os.getenv("PINECONE_ENVIRONMENT", "")

    # Elasticsearch
    elasticsearch_url: str = os.getenv("ELASTICSEARCH_URL", "http://elasticsearch:9200")
    elasticsearch_index: str = os.getenv("ELASTICSEARCH_INDEX", "enterprise-search")
    elasticsearch_api_key: str = os.getenv("ELASTICSEARCH_API_KEY", "")

    # MongoDB
    mongodb_uri: str = os.getenv("MONGODB_URI", "")

    # DLP.
    # DLP is **optional** in development. Set DLP_ENABLED=true in prod to
    # enforce the fail-closed scan pipeline. When disabled the indexer uses a
    # NoOp scanner that logs a loud warning on every chunk.
    dlp_enabled: bool = os.getenv("DLP_ENABLED", "false").lower() in (
        "1",
        "true",
        "yes",
        "on",
    )
    dlp_inspect_template: str = os.getenv("DLP_INSPECT_TEMPLATE", "")
    dlp_deidentify_template: str = os.getenv("DLP_DEIDENTIFY_TEMPLATE", "")

    # Audit
    firestore_audit_collection: str = os.getenv(
        "FIRESTORE_AUDIT_COLLECTION", "audit_logs"
    )

    # Server
    cors_origins: list[str] = [
        o.strip()
        for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
        if o.strip()
    ]


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance."""
    return Settings()
