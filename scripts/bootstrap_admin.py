"""One-off: grant the first `admin` role.

The FastAPI ``/admin/roles`` endpoint requires an already-admin caller, so the
very first admin has to be bootstrapped out-of-band. Run this script once,
locally, with your Firebase service account JSON path, then sign out and back
in so your ID token carries the new custom claim.

Usage:
    python scripts/bootstrap_admin.py <firebase_uid>
    python scripts/bootstrap_admin.py <firebase_uid> --role engineering
    python scripts/bootstrap_admin.py --email alice@example.com

Env:
    FIREBASE_CREDENTIALS_PATH   Path to the Firebase Admin SDK JSON key.
                                Defaults to backend/secrets/firebase.json.
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

import firebase_admin
from firebase_admin import auth, credentials

ROLES = ("hr", "engineering", "sales", "finance", "executive", "admin")


def resolve_credentials_path() -> Path:
    """Return the path to the Firebase Admin SDK JSON key, or exit 1."""
    raw = os.getenv("FIREBASE_CREDENTIALS_PATH") or os.getenv(
        "GOOGLE_APPLICATION_CREDENTIALS"
    ) or "backend/secrets/firebase.json"
    path = Path(raw)
    if not path.is_file():
        sys.exit(
            f"credentials file not found at {path}. Set FIREBASE_CREDENTIALS_PATH "
            "or place the JSON at backend/secrets/firebase.json."
        )
    return path


def parse_args() -> argparse.Namespace:
    """CLI argument parser."""
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("uid", nargs="?", help="Firebase UID of the target user")
    ap.add_argument(
        "--email", help="Look up UID by email instead of passing it directly"
    )
    ap.add_argument(
        "--role",
        default="admin",
        choices=ROLES,
        help="Role to assign. Defaults to 'admin'.",
    )
    return ap.parse_args()


def main() -> None:
    """Assign the requested role to the target Firebase user."""
    args = parse_args()
    if not args.uid and not args.email:
        sys.exit("Provide either a UID argument or --email.")

    cred = credentials.Certificate(str(resolve_credentials_path()))
    firebase_admin.initialize_app(cred)

    uid = args.uid
    if args.email and not uid:
        uid = auth.get_user_by_email(args.email).uid

    user = auth.get_user(uid)
    claims = dict(user.custom_claims or {})
    claims["role"] = args.role
    auth.set_custom_user_claims(uid, claims)

    print(
        f"granted role={args.role} to uid={uid} email={user.email}. "
        "Sign out and back in so the new token includes the claim."
    )


if __name__ == "__main__":
    main()
