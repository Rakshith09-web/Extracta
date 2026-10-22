from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, timezone
from supabase import Client
import logging

logger = logging.getLogger(__name__)


class CRMRepository:
    """
    Data Access Layer for CRM and AI Agent persistent operations in Supabase.
    Works with either user-scoped Supabase client (enforces RLS) or admin client (workers).
    """

    # --------------------------------------------------------------------------
    # Sales Requests
    # --------------------------------------------------------------------------
    @staticmethod
    def create_sales_request(
        db: Client,
        tenant_id: UUID,
        user_id: UUID,
        request_text: str,
        parsed_parameters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        data = {
            "tenant_id": str(tenant_id),
            "user_id": str(user_id),
            "request_text": request_text,
            "parsed_parameters": parsed_parameters or {},
            "status": "PENDING",
        }
        res = db.table("sales_requests").insert(data).execute()
        return res.data[0] if res.data else {}

    @staticmethod
    def get_sales_request(db: Client, request_id: UUID) -> Optional[Dict[str, Any]]:
        res = db.table("sales_requests").select("*").eq("id", str(request_id)).single().execute()
        return res.data

    @staticmethod
    def list_sales_requests(db: Client, tenant_id: UUID, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        res = (
            db.table("sales_requests")
            .select("*")
            .eq("tenant_id", str(tenant_id))
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return res.data or []

    # --------------------------------------------------------------------------
    # Jobs
    # --------------------------------------------------------------------------
    @staticmethod
    def create_job(
        db: Client,
        tenant_id: UUID,
        request_id: UUID,
        job_type: str = "LEAD_SEARCH",
        total_count: int = 0
    ) -> Dict[str, Any]:
        data = {
            "tenant_id": str(tenant_id),
            "request_id": str(request_id),
            "job_type": job_type,
            "status": "QUEUED",
            "stage": "UNDERSTAND",
            "progress": 0,
            "processed_count": 0,
            "total_count": total_count,
        }
        res = db.table("jobs").insert(data).execute()
        return res.data[0] if res.data else {}

    @staticmethod
    def update_job(
        db: Client,
        job_id: UUID,
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        res = db.table("jobs").update(updates).eq("id", str(job_id)).execute()
        return res.data[0] if res.data else {}

    @staticmethod
    def get_job(db: Client, job_id: UUID) -> Optional[Dict[str, Any]]:
        res = db.table("jobs").select("*").eq("id", str(job_id)).single().execute()
        return res.data

    @staticmethod
    def list_jobs(db: Client, tenant_id: UUID, limit: int = 50) -> List[Dict[str, Any]]:
        res = (
            db.table("jobs")
            .select("*")
            .eq("tenant_id", str(tenant_id))
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return res.data or []

    # --------------------------------------------------------------------------
    # Leads
    # --------------------------------------------------------------------------
    @staticmethod
    def create_lead(db: Client, tenant_id: UUID, lead_dict: Dict[str, Any]) -> Dict[str, Any]:
        lead_dict["tenant_id"] = str(tenant_id)
        res = db.table("leads").insert(lead_dict).execute()
        return res.data[0] if res.data else {}

    @staticmethod
    def bulk_create_leads(db: Client, tenant_id: UUID, leads: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        for l in leads:
            l["tenant_id"] = str(tenant_id)
        res = db.table("leads").insert(leads).execute()
        return res.data or []

    @staticmethod
    def get_lead(db: Client, lead_id: UUID) -> Optional[Dict[str, Any]]:
        res = db.table("leads").select("*, lead_validations(*), lead_enrichments(*), lead_mappings(*)").eq("id", str(lead_id)).single().execute()
        return res.data

    @staticmethod
    def list_leads(
        db: Client,
        tenant_id: UUID,
        query: Optional[str] = None,
        lead_status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        builder = db.table("leads").select("*").eq("tenant_id", str(tenant_id))
        if lead_status:
            builder = builder.eq("lead_status", lead_status)
        if query:
            builder = builder.or_(f"full_name.ilike.%{query}%,company_name.ilike.%{query}%,email.ilike.%{query}%")
        
        res = builder.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        return res.data or []

    @staticmethod
    def update_lead(db: Client, lead_id: UUID, updates: Dict[str, Any]) -> Dict[str, Any]:
        res = db.table("leads").update(updates).eq("id", str(lead_id)).execute()
        return res.data[0] if res.data else {}

    @staticmethod
    def delete_lead(db: Client, lead_id: UUID) -> bool:
        res = db.table("leads").delete().eq("id", str(lead_id)).execute()
        return bool(res.data)

    # --------------------------------------------------------------------------
    # Agent Executions & Tool Calls Logging
    # --------------------------------------------------------------------------
    @staticmethod
    def log_agent_execution(
        db: Client,
        tenant_id: UUID,
        node_name: str,
        status: str,
        request_id: Optional[UUID] = None,
        job_id: Optional[UUID] = None,
        input_data: Optional[Dict[str, Any]] = None,
        output_data: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None,
        duration_ms: Optional[int] = None
    ) -> Dict[str, Any]:
        data = {
            "tenant_id": str(tenant_id),
            "request_id": str(request_id) if request_id else None,
            "job_id": str(job_id) if job_id else None,
            "node_name": node_name,
            "status": status,
            "input": input_data or {},
            "output": output_data or {},
            "error": error,
            "duration_ms": duration_ms
        }
        res = db.table("agent_executions").insert(data).execute()
        return res.data[0] if res.data else {}

    @staticmethod
    def log_tool_call(
        db: Client,
        tenant_id: UUID,
        tool_name: str,
        status: str,
        job_id: Optional[UUID] = None,
        input_data: Optional[Dict[str, Any]] = None,
        output_data: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None,
        duration_ms: Optional[int] = None
    ) -> Dict[str, Any]:
        data = {
            "tenant_id": str(tenant_id),
            "job_id": str(job_id) if job_id else None,
            "tool_name": tool_name,
            "status": status,
            "input": input_data or {},
            "output": output_data or {},
            "error": error,
            "duration_ms": duration_ms
        }
        res = db.table("tool_calls").insert(data).execute()
        return res.data[0] if res.data else {}
