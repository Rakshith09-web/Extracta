from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query
from supabase import Client
from app.api.deps import get_current_profile, get_admin_db, RoleChecker
from app.schemas.profile import ProfileResponse, UserRole
from app.services.audit_service import AuditService
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

require_admin_or_manager = RoleChecker([UserRole.ADMIN, UserRole.SALES_MANAGER])


@router.get("/", response_model=List[Dict[str, Any]])
async def list_audit_logs(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    profile: ProfileResponse = Depends(require_admin_or_manager),
    admin_db: Client = Depends(get_admin_db),
):
    """
    List tenant security and action audit logs.
    Accessible by ADMIN and SALES_MANAGER.
    """
    logs = AuditService.list_logs(
        db=admin_db,
        tenant_id=profile.tenant_id,
        limit=limit,
        offset=offset
    )

    # Attach actor profile names if user_id exists
    for log in logs:
        if log.get("user_id"):
            u_res = admin_db.table("profiles").select("full_name, email").eq("id", log["user_id"]).single().execute()
            if u_res.data:
                log["actor_name"] = u_res.data.get("full_name") or u_res.data.get("email")
        else:
            log["actor_name"] = "System Agent"

    return logs
