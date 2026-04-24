"""Unit tests for :mod:`backend.services.permission_filter`."""

from __future__ import annotations

from backend.models.user import Role
from backend.services.permission_filter import (
    filter_results,
    is_authorized,
    metadata_is_authorized,
)

from .conftest import make_result, make_user


class TestIsAuthorized:
    def test_admin_sees_everything(self):
        admin = make_user(Role.ADMIN)
        assert is_authorized(admin, [], owner_email="someone@example.com")
        assert is_authorized(admin, ["finance"], owner_email="x@y.com")
        assert is_authorized(admin, ["hr", "engineering"], owner_email="x@y.com")

    def test_role_in_allowed_list_is_authorized(self):
        u = make_user(Role.ENGINEERING)
        assert is_authorized(u, ["engineering", "hr"], owner_email="bob@x.com")

    def test_role_not_in_allowed_list_is_denied(self):
        u = make_user(Role.SALES)
        assert not is_authorized(u, ["engineering", "hr"], owner_email="bob@x.com")

    def test_empty_allowed_roles_allows_only_owner(self):
        """Fail-closed: empty ACL means only the owner (or admin) can see it."""
        owner = make_user(Role.ENGINEERING, email="owner@example.com")
        other = make_user(Role.ENGINEERING, email="other@example.com")
        assert is_authorized(owner, [], owner_email="owner@example.com")
        assert not is_authorized(other, [], owner_email="owner@example.com")

    def test_empty_allowed_and_no_owner_denies(self):
        u = make_user(Role.ENGINEERING)
        assert not is_authorized(u, [], owner_email=None)

    def test_ignores_blank_strings_in_allowed_roles(self):
        u = make_user(Role.HR)
        assert not is_authorized(u, ["", None], owner_email="x@y.com")  # type: ignore[list-item]


class TestFilterResults:
    def test_drops_unauthorized_and_preserves_order(self):
        user = make_user(Role.ENGINEERING)
        results = [
            make_result(chunk_id="a", allowed_roles=["engineering"]),
            make_result(chunk_id="b", allowed_roles=["hr"]),
            make_result(chunk_id="c", allowed_roles=["engineering", "sales"]),
        ]
        out = filter_results(user, results)
        assert [r.chunk_id for r in out] == ["a", "c"]

    def test_admin_sees_all(self):
        admin = make_user(Role.ADMIN)
        results = [
            make_result(chunk_id="a", allowed_roles=["engineering"]),
            make_result(chunk_id="b", allowed_roles=[]),
            make_result(chunk_id="c", allowed_roles=["hr"]),
        ]
        assert len(filter_results(admin, results)) == 3

    def test_returns_new_list_not_mutated(self):
        user = make_user(Role.HR)
        results = [
            make_result(chunk_id="a", allowed_roles=["hr"]),
            make_result(chunk_id="b", allowed_roles=["engineering"]),
        ]
        original = list(results)
        filter_results(user, results)
        assert results == original


class TestMetadataAuthorized:
    def test_authorized_metadata_dict(self):
        u = make_user(Role.FINANCE)
        md = {"allowed_roles": ["finance"], "owner_email": "x@x.com"}
        assert metadata_is_authorized(u, md)

    def test_unauthorized_metadata_dict(self):
        u = make_user(Role.FINANCE)
        md = {"allowed_roles": ["engineering"], "owner_email": "x@x.com"}
        assert not metadata_is_authorized(u, md)

    def test_missing_metadata_keys_fail_closed(self):
        u = make_user(Role.FINANCE)
        assert not metadata_is_authorized(u, {})
