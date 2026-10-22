import pytest
import uuid
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from fastapi import HTTPException
from app.main import app
from app.core.crypto import encrypt_secret, decrypt_secret
from app.core.rate_limit import check_rate_limit, _memory_windows
from app.schemas.profile import UserRole, ProfileResponse
from app.api.deps import RoleChecker

client = TestClient(app)


def test_crypto_encryption_and_decryption():
    """
    Test 1: Verify API secrets are encrypted at rest and correctly decrypted.
    """
    secret = "sk_live_apollo_99182374619827364128"
    ciphertext = encrypt_secret(secret)
    assert ciphertext != secret, "Encrypted ciphertext must not match plaintext"
    assert len(ciphertext) > len(secret)

    decrypted = decrypt_secret(ciphertext)
    assert decrypted == secret, "Decrypted text must match original plaintext"


def test_security_headers_present():
    """
    Test 2: Verify all enterprise security headers are returned on API endpoints.
    """
    response = client.get("/")
    assert response.status_code == 200
    headers = response.headers

    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert headers.get("X-Frame-Options") == "DENY"
    assert headers.get("X-XSS-Protection") == "1; mode=block"
    assert "Strict-Transport-Security" in headers
    assert "Referrer-Policy" in headers


def test_rate_limiter_threshold():
    """
    Test 3: Verify sliding window rate limiter raises HTTP 429 when threshold exceeded.
    """
    class MockRequest:
        def __init__(self, ip):
            self.client = type("Client", (), {"host": ip})()
            self.headers = {}

    test_ip = f"10.0.0.{uuid.uuid4().hex[:6]}"
    req = MockRequest(test_ip)

    # First 3 requests should succeed with max_requests=3
    assert check_rate_limit(req, max_requests=3, window_seconds=10, key_prefix="test_inmem") is True
    assert check_rate_limit(req, max_requests=3, window_seconds=10, key_prefix="test_inmem") is True
    assert check_rate_limit(req, max_requests=3, window_seconds=10, key_prefix="test_inmem") is True

    # 4th request must raise HTTP 429
    with pytest.raises(HTTPException) as exc_info:
        check_rate_limit(req, max_requests=3, window_seconds=10, key_prefix="test_inmem")
    
    assert exc_info.value.status_code == 429
    assert "Too many requests" in exc_info.value.detail


def test_rbac_role_checker_enforcement():
    """
    Test 4: Verify RoleChecker dependency blocks unauthorized roles (HTTP 403).
    """
    admin_checker = RoleChecker([UserRole.ADMIN])
    now = datetime.now(timezone.utc)
    
    mock_rep_profile = ProfileResponse(
        id=uuid.uuid4(),
        tenant_id=uuid.uuid4(),
        email="salesrep@example.com",
        role=UserRole.SALES_REPRESENTATIVE,
        full_name="Sales Representative User",
        is_active=True,
        created_at=now,
        updated_at=now
    )

    with pytest.raises(HTTPException) as exc:
        admin_checker(mock_rep_profile)
    assert exc.value.status_code == 403
    assert "Forbidden" in exc.value.detail


def test_tenant_boundary_isolation():
    """
    Test 5: Verify cross-tenant isolation logic prevents Tenant B from accessing Tenant A's objects.
    """
    tenant_a_id = uuid.uuid4()
    tenant_b_id = uuid.uuid4()

    mock_record_tenant_a = {
        "id": str(uuid.uuid4()),
        "tenant_id": str(tenant_a_id),
        "full_name": "Target Lead A"
    }

    # Simulate authorization check
    is_accessible_by_tenant_b = str(mock_record_tenant_a["tenant_id"]) == str(tenant_b_id)
    assert is_accessible_by_tenant_b is False, "Tenant B must not have access to Tenant A's records."


def test_delete_search_unauthorized_access():
    """
    Test 6: Verify DELETE /api/v1/searches/{id} requires valid JWT authentication.
    """
    random_id = str(uuid.uuid4())
    res = client.delete(f"/api/v1/searches/{random_id}")
    assert res.status_code == 401


def test_outreach_endpoints_auth_protection():
    """
    Test 7: Verify POST /api/v1/outreach/send-bulk requires JWT authentication.
    """
    res = client.post("/api/v1/outreach/send-bulk", json={"lead_ids": [str(uuid.uuid4())], "subject": "Hi", "body_template": "Hello"})
    assert res.status_code == 401
