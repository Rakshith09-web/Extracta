from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from app.api.deps import get_current_profile, get_current_tenant, get_admin_db, RoleChecker
from app.schemas.profile import ProfileResponse, UserRole
from app.schemas.tenant import TenantResponse
from app.schemas.user_management import TenantUpdateRequest, TenantDetailsResponse
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

require_admin_only = RoleChecker([UserRole.ADMIN])


@router.get("/current", response_model=TenantDetailsResponse)
async def get_current_tenant_details(
    profile: ProfileResponse = Depends(get_current_profile),
    tenant: TenantResponse = Depends(get_current_tenant),
    admin_db: Client = Depends(get_admin_db),
):
    """
    Get current tenant organization details and team member count.
    Accessible by all authenticated members of the tenant.
    """
    try:
        count_res = admin_db.table("profiles").select("id", count="exact").eq("tenant_id", str(tenant.id)).execute()
        member_count = count_res.count if count_res.count is not None else 1

        return TenantDetailsResponse(
            id=tenant.id,
            name=tenant.name,
            status=tenant.status,
            member_count=member_count,
            created_at=tenant.created_at,
            updated_at=tenant.updated_at
        )
    except Exception as e:
        logger.error(f"Error fetching tenant details: {e}")
        return TenantDetailsResponse(
            id=tenant.id,
            name=tenant.name,
            status=tenant.status,
            member_count=1,
            created_at=tenant.created_at,
            updated_at=tenant.updated_at
        )


@router.patch("/current", response_model=TenantResponse)
async def update_tenant_name(
    update_data: TenantUpdateRequest,
    profile: ProfileResponse = Depends(require_admin_only),
    tenant: TenantResponse = Depends(get_current_tenant),
    admin_db: Client = Depends(get_admin_db),
):
    """
    Update tenant organization name.
    Accessible strictly by ADMIN.
    """
    try:
        update_res = admin_db.table("tenants").update({
            "name": update_data.name
        }).eq("id", str(tenant.id)).execute()

        if not update_res.data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant update failed.")

        return TenantResponse(**update_res.data[0])
    except Exception as e:
        logger.error(f"Error updating tenant {tenant.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not update tenant: {str(e)}"
        )
