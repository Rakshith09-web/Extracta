from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
from app.core.config import settings
from app.core.security import verify_supabase_jwt
from app.core.supabase import get_supabase_admin_client, get_supabase_user_client
from app.schemas.auth import AuthUser, AuthenticatedUserContext
from app.schemas.profile import ProfileResponse, UserRole
from app.schemas.tenant import TenantResponse
import logging

logger = logging.getLogger(__name__)

security_scheme = HTTPBearer(auto_error=False)


async def get_token_header(
    auth_credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
) -> str:
    """Extracts and ensures Bearer token from the Authorization header."""
    if not auth_credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header or invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return auth_credentials.credentials


async def get_current_user(
    token: str = Depends(get_token_header),
) -> AuthUser:
    """Validates Supabase JWT and returns authenticated AuthUser."""
    payload = await verify_supabase_jwt(token)
    user_id = payload.get("sub")
    email = payload.get("email")
    if not user_id or not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token claims: missing sub or email",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return AuthUser(
        id=user_id,
        email=email,
        role=payload.get("role", "authenticated"),
        user_metadata=payload.get("user_metadata", {}),
        app_metadata=payload.get("app_metadata", {})
    )


def get_user_db(token: str = Depends(get_token_header)) -> Client:
    """Provides user-scoped Supabase client that enforces RLS policies."""
    return get_supabase_user_client(token)


def get_admin_db() -> Client:
    """Provides service-role Supabase client that bypasses RLS for server-side tasks."""
    return get_supabase_admin_client()


async def get_current_profile(
    current_user: AuthUser = Depends(get_current_user),
    admin_db: Client = Depends(get_admin_db)
) -> ProfileResponse:
    """Fetches user profile from database."""
    try:
        response = admin_db.table("profiles").select("*").eq("id", str(current_user.id)).single().execute()
        if response.data:
            return ProfileResponse(**response.data)
    except Exception as e:
        logger.error(f"Error fetching profile for user {current_user.id}: {e}")
        # In mock or fallback mode if database isn't populated yet:
        if settings.MOCK_EXTERNAL_SERVICES:
            return ProfileResponse(
                id=current_user.id,
                tenant_id="00000000-0000-0000-0000-000000000001",
                full_name=current_user.user_metadata.get("full_name", "Mock Admin"),
                email=current_user.email,
                role=UserRole.ADMIN,
                status="ACTIVE",
                created_at="2026-08-21T00:00:00Z",
                updated_at="2026-08-21T00:00:00Z"
            )

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="User profile not found in current organization",
    )


async def get_current_tenant(
    profile: ProfileResponse = Depends(get_current_profile),
    admin_db: Client = Depends(get_admin_db)
) -> TenantResponse:
    """Fetches tenant organization for the current user's profile."""
    try:
        response = admin_db.table("tenants").select("*").eq("id", str(profile.tenant_id)).single().execute()
        if response.data:
            return TenantResponse(**response.data)
    except Exception as e:
        logger.error(f"Error fetching tenant {profile.tenant_id}: {e}")
        if settings.MOCK_EXTERNAL_SERVICES:
            return TenantResponse(
                id=profile.tenant_id,
                name="Acme Sales Corp",
                status="ACTIVE",
                created_at="2026-08-21T00:00:00Z",
                updated_at="2026-08-21T00:00:00Z"
            )

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Tenant organization not found",
    )


class RoleChecker:
    """RBAC dependency to enforce permitted roles."""
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, profile: ProfileResponse = Depends(get_current_profile)) -> ProfileResponse:
        if profile.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: requires one of roles {[r.value for r in self.allowed_roles]}",
            )
        return profile
