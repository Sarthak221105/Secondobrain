"""User and role models."""

from __future__ import annotations

from enum import Enum
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class Role(str, Enum):
    """Roles recognized by the permission system."""

    HR = "hr"
    ENGINEERING = "engineering"
    SALES = "sales"
    FINANCE = "finance"
    EXECUTIVE = "executive"
    ADMIN = "admin"


ALL_ROLES: tuple[str, ...] = tuple(r.value for r in Role)


class User(BaseModel):
    """An authenticated user extracted from a Firebase JWT."""

    uid: str
    email: EmailStr
    role: Role
    display_name: str | None = None
    mfa_verified: bool = False


class RoleAssignment(BaseModel):
    """Payload for an admin assigning a role to a user."""

    target_uid: str = Field(..., description="Firebase UID of the target user")
    role: Role


class AuditLogEntry(BaseModel):
    """A single row in the audit log."""

    user_id: str
    user_email: EmailStr
    query: str
    result_count: int
    timestamp: str
    ip_address: str | None = None
    action: Literal["search", "admin_action"] = "search"
