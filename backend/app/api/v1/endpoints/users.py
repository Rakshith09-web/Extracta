from typing import List
from uuid import UUID
import secrets
import string
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from app.api.deps import get_current_user, get_current_profile, get_admin_db, RoleChecker
from app.schemas.auth import AuthUser
from app.schemas.profile import ProfileResponse, UserRole
from app.schemas.user_management import (
    TeamMemberResponse,
    UserInviteRequest,
    UserRoleUpdateRequest,
    UserStatusUpdateRequest,
)
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# RBAC Permissions
require_admin_or_manager = RoleChecker([UserRole.ADMIN, UserRole.SALES_MANAGER])
require_admin_only = RoleChecker([UserRole.ADMIN])


@router.get("/", response_model=List[TeamMemberResponse])
async def list_tenant_users(
    profile: ProfileResponse = Depends(require_admin_or_manager),
    admin_db: Client = Depends(get_admin_db),
):
    """
    List all team members belonging to the current tenant organization.
    Accessible by ADMIN and SALES_MANAGER.
    """
    try:
        response = admin_db.table("profiles").select("*").eq("tenant_id", str(profile.tenant_id)).order("created_at").execute()
        return response.data or []
    except Exception as e:
        logger.error(f"Error fetching users for tenant {profile.tenant_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not retrieve team members: {str(e)}"
        )


@router.post("/invite", response_model=TeamMemberResponse)
async def invite_team_member(
    invite_data: UserInviteRequest,
    profile: ProfileResponse = Depends(require_admin_only),
    admin_db: Client = Depends(get_admin_db),
):
    """
    Provision/invite a new user to the tenant organization.
    Accessible strictly by ADMIN.
    """
    tenant_id_str = str(profile.tenant_id)
    
    # Generate temporary password if not provided
    temp_password = invite_data.password
    if not temp_password:
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        temp_password = "".join(secrets.choice(alphabet) for _ in range(12))

    try:
        # Create user in Supabase Auth via Admin client
        auth_response = admin_db.auth.admin.create_user({
            "email": invite_data.email,
            "password": temp_password,
            "email_confirm": True,  # Pre-confirm user for immediate team onboarding
            "user_metadata": {
                "full_name": invite_data.full_name,
                "tenant_id": tenant_id_str,
                "role": invite_data.role.value
            }
        })
        
        if not auth_response or not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user in authentication provider."
            )
            
        new_user_id = auth_response.user.id

        # Upsert profile record explicitly associated with caller's tenant
        profile_data = {
            "id": new_user_id,
            "tenant_id": tenant_id_str,
            "full_name": invite_data.full_name,
            "email": invite_data.email,
            "role": invite_data.role.value,
            "status": "ACTIVE"
        }
        
        prof_res = admin_db.table("profiles").upsert(profile_data).execute()
        if not prof_res.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="User was created in Auth but profile record insertion failed."
            )

        return prof_res.data[0]
    except Exception as e:
        logger.error(f"Failed to invite team member {invite_data.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to invite team member: {str(e)}"
        )


@router.patch("/{user_id}/role", response_model=TeamMemberResponse)
async def update_member_role(
    user_id: UUID,
    role_update: UserRoleUpdateRequest,
    profile: ProfileResponse = Depends(require_admin_only),
    admin_db: Client = Depends(get_admin_db),
):
    """
    Update a team member's role.
    Accessible strictly by ADMIN.
    """
    tenant_id_str = str(profile.tenant_id)
    user_id_str = str(user_id)

    # Check target user belongs to caller's tenant
    target_res = admin_db.table("profiles").select("*").eq("id", user_id_str).eq("tenant_id", tenant_id_str).execute()
    if not target_res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in your organization."
        )

    # Prevent demoting self if caller is the last remaining admin
    if user_id_str == str(profile.id) and role_update.role != UserRole.ADMIN:
        admins_res = admin_db.table("profiles").select("id").eq("tenant_id", tenant_id_str).eq("role", "ADMIN").execute()
        if len(admins_res.data) <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot demote the sole Administrator of the organization."
            )

    try:
        update_res = admin_db.table("profiles").update({
            "role": role_update.role.value
        }).eq("id", user_id_str).eq("tenant_id", tenant_id_str).execute()

        if not update_res.data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role update failed.")

        return update_res.data[0]
    except Exception as e:
        logger.error(f"Error updating role for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not update role: {str(e)}"
        )


@router.patch("/{user_id}/status", response_model=TeamMemberResponse)
async def update_member_status(
    user_id: UUID,
    status_update: UserStatusUpdateRequest,
    profile: ProfileResponse = Depends(require_admin_only),
    admin_db: Client = Depends(get_admin_db),
):
    """
    Activate, Inactivate, or Suspend a team member.
    Accessible strictly by ADMIN.
    """
    tenant_id_str = str(profile.tenant_id)
    user_id_str = str(user_id)

    if user_id_str == str(profile.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own account status."
        )

    target_res = admin_db.table("profiles").select("*").eq("id", user_id_str).eq("tenant_id", tenant_id_str).execute()
    if not target_res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in your organization."
        )

    try:
        update_res = admin_db.table("profiles").update({
            "status": status_update.status
        }).eq("id", user_id_str).eq("tenant_id", tenant_id_str).execute()

        return update_res.data[0]
    except Exception as e:
        logger.error(f"Error updating status for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not update status: {str(e)}"
        )
