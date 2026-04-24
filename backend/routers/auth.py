"""Firebase authentication + JWT verification middleware.

Every protected route depends on :func:`get_current_user`. If the token is
missing, malformed, expired, or fails Firebase signature verification the
request is rejected with HTTP 401. If the token is valid but the user's custom
claim does not include a recognized role the request is rejected with HTTP 403.

The Firebase Admin SDK is initialized lazily so test environments can patch it
before the first call.
"""

from __future__ import annotations

import logging
from typing import Annotated

import firebase_admin
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth as fb_auth
from firebase_admin import credentials

from ..config import get_settings  # noqa: F401  (used in get_current_user)
from ..models.user import ALL_ROLES, Role, User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

_bearer = HTTPBearer(auto_error=False)
_initialized = False


def _init_firebase() -> None:
    """Initialize the Firebase Admin SDK once per process."""
    global _initialized
    if _initialized:
        return
    settings = get_settings()
    try:
        if settings.firebase_credentials_path:
            cred = credentials.Certificate(settings.firebase_credentials_path)
            firebase_admin.initialize_app(cred)
        else:
            firebase_admin.initialize_app()
        _initialized = True
    except ValueError:
        # Already initialized (common in test reloads).
        _initialized = True


async def get_current_user(
    request: Request,
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> User:
    """Verify the Firebase JWT and return the authenticated :class:`User`.

    Raises :class:`HTTPException` 401 on any failure to verify the token and
    403 if the token is valid but the user has no recognized role.

    **Dev-mode bypass**: when ``AUTH_ENABLED=false`` Firebase is skipped
    entirely. The caller's identity comes from two request headers:

    * ``X-Dev-Role`` — one of :data:`ALL_ROLES` (default: ``engineering``).
    * ``X-Dev-Email`` — optional email to stamp into the fake user.

    This exists so the UI can offer a role switcher (see
    ``components/RoleSwitcher.tsx``) without real SSO. Never enable this
    configuration in production.
    """
    settings = get_settings()

    if not settings.auth_enabled:
        role_raw = (request.headers.get("x-dev-role") or "engineering").lower().strip()
        if role_raw not in ALL_ROLES:
            role_raw = "engineering"
        email = (
            request.headers.get("x-dev-email")
            or f"dev-{role_raw}@example.com"
        )
        request.state.user_uid = f"dev-{role_raw}"
        request.state.user_role = role_raw
        logger.debug("auth disabled — using dev user role=%s", role_raw)
        return User(
            uid=f"dev-{role_raw}",
            email=email,
            role=Role(role_raw),
            display_name=f"Dev {role_raw.title()}",
            mfa_verified=True,
        )

    if creds is None or creds.scheme.lower() != "bearer" or not creds.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header",
        )

    _init_firebase()

    try:
        decoded = fb_auth.verify_id_token(creds.credentials, check_revoked=True)
    except fb_auth.ExpiredIdTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired"
        ) from exc
    except fb_auth.RevokedIdTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token revoked"
        ) from exc
    except (fb_auth.InvalidIdTokenError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        ) from exc

    role_claim = decoded.get("role")
    if role_claim not in ALL_ROLES:
        logger.warning(
            "User %s presented a valid token with unknown role=%r",
            decoded.get("uid"),
            role_claim,
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User has no recognized role assignment",
        )

    # MFA is required for sensitive sessions; we surface the flag so
    # individual routes can enforce it.
    mfa_verified = bool(decoded.get("firebase", {}).get("sign_in_second_factor"))

    request.state.user_uid = decoded["uid"]
    request.state.user_role = role_claim

    return User(
        uid=decoded["uid"],
        email=decoded.get("email", ""),
        role=Role(role_claim),
        display_name=decoded.get("name"),
        mfa_verified=mfa_verified,
    )


def require_roles(*roles: Role):
    """Return a dependency that rejects users whose role is not in ``roles``."""

    allowed = {r.value for r in roles}

    async def _dep(user: Annotated[User, Depends(get_current_user)]) -> User:
        if user.role.value not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient role for this resource",
            )
        return user

    return _dep


@router.get("/me", response_model=User)
async def me(user: Annotated[User, Depends(get_current_user)]) -> User:
    """Return the authenticated user's profile. Useful for the frontend."""
    return user
