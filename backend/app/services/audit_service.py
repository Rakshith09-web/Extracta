from typing import Optional, Dict, Any, List
from uuid import UUID
from supabase import Client
import logging

logger = logging.getLogger(__name__)


class AuditService:
    """
    Security and Audit Logging service for tracking critical tenant actions.
    """

    @staticmethod
    def log_event(
        db: Client,
        tenant_id: UUID,
        action: str,
        resource_type: str,
        user_id: Optional[UUID] = None,
        resource_id: Optional[UUID] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        try:
            data = {
                "tenant_id": str(tenant_id),
                "user_id": str(user_id) if user_id else None,
                "action": action,
                "resource_type": resource_type,
                "resource_id": str(resource_id) if resource_id else None,
                "metadata": metadata or {}
            }
            res = db.table("audit_logs").insert(data).execute()
            return res.data[0] if res.data else {}
        except Exception as e:
            logger.error(f"Failed to record audit log: {e}")
            return {}

    @staticmethod
    def list_logs(
        db: Client,
        tenant_id: UUID,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        try:
            res = (
                db.table("audit_logs")
                .select("*")
                .eq("tenant_id", str(tenant_id))
                .order("created_at", desc=True)
                .range(offset, offset + limit - 1)
                .execute()
            )
            return res.data or []
        except Exception as e:
            logger.error(f"Failed to retrieve audit logs: {e}")
            return []
