from fastapi import APIRouter, Depends
from app.api.deps import get_current_user, get_current_profile, get_current_tenant, get_user_db
from app.schemas.auth import AuthUser, AuthenticatedUserContext
from app.schemas.profile import ProfileResponse
from app.schemas.tenant import TenantResponse
from supabase import Client

router = APIRouter()


@router.get("/me", response_model=AuthenticatedUserContext)
async def get_my_context(
    current_user: AuthUser = Depends(get_current_user),
    profile: ProfileResponse = Depends(get_current_profile),
    tenant: TenantResponse = Depends(get_current_tenant),
):
    """
    Returns the authenticated user's session context, profile, and tenant.
    Demonstrates Supabase JWT token verification on FastAPI.
    """
    return AuthenticatedUserContext(
        user=current_user,
        profile=profile,
        tenant=tenant
    )


@router.get("/test-rls")
async def test_user_rls(
    current_user: AuthUser = Depends(get_current_user),
    user_db: Client = Depends(get_user_db),
):
    """
    Demonstrates User-Scoped Supabase Client executing a query with PostgreSQL RLS.
    """
    try:
        response = user_db.table("profiles").select("*").execute()
        return {
            "message": "Successfully queried profiles with user-scoped RLS",
            "user_id": str(current_user.id),
            "accessible_records_count": len(response.data) if response.data else 0,
            "records": response.data
        }
    except Exception as e:
        return {
            "message": "RLS query executed",
            "error": str(e)
        }
