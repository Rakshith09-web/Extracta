from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from app.api.deps import get_current_profile, get_admin_db
from app.schemas.profile import ProfileResponse
from app.schemas.user_management import UserProfileUpdateRequest
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.patch("/me", response_model=ProfileResponse)
async def update_my_profile(
    update_data: UserProfileUpdateRequest,
    profile: ProfileResponse = Depends(get_current_profile),
    admin_db: Client = Depends(get_admin_db),
):
    """
    Update the authenticated user's own profile (e.g. full_name).
    """
    try:
        update_res = admin_db.table("profiles").update({
            "full_name": update_data.full_name
        }).eq("id", str(profile.id)).execute()

        if not update_res.data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Profile update failed.")

        return ProfileResponse(**update_res.data[0])
    except Exception as e:
        logger.error(f"Error updating profile for user {profile.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not update profile: {str(e)}"
        )
