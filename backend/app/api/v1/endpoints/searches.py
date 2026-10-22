from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from app.api.deps import get_current_user, get_current_profile, get_admin_db, get_user_db
from app.schemas.auth import AuthUser
from app.schemas.profile import ProfileResponse
from app.schemas.crm import (
    SalesRequestCreate,
    SalesRequestResponse,
    JobResponse,
    JobStatus,
    SalesRequestStatus
)
from app.repositories.crm_repository import CRMRepository
from app.services.audit_service import AuditService
import re
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


def parse_natural_language_query(text: str) -> Dict[str, Any]:
    """
    Rule-based extraction helper for initial search requests before LangGraph in Phase 5.
    Extracts industry, location, job_title, lead_count, email_required.
    """
    params: Dict[str, Any] = {
        "industry": None,
        "location": None,
        "job_title": None,
        "lead_count": 25,
        "email_required": True
    }
    
    # Extract count
    count_match = re.search(r'\b(\d+)\b', text)
    if count_match:
        params["lead_count"] = min(int(count_match.group(1)), 250)

    # Extract location
    loc_match = re.search(r'\bin\s+([A-Za-z\s]+?)(?:\s+and|\s+with|\.|$)', text, re.IGNORECASE)
    if loc_match:
        params["location"] = loc_match.group(1).strip()

    # Extract title
    title_match = re.search(r'\b(?:their|find)\s+([A-Za-z\s]+?(?:manager|director|lead|officer|engineer|vp|head|ceo|cto|founder))', text, re.IGNORECASE)
    if title_match:
        params["job_title"] = title_match.group(1).strip()
    elif "hr" in text.lower():
        params["job_title"] = "HR Manager"
    elif "founder" in text.lower() or "ceo" in text.lower():
        params["job_title"] = "CEO / Founder"

    # Extract industry
    for ind in ["Software", "IT", "Healthcare", "Fintech", "Real Estate", "Manufacturing", "E-commerce", "SaaS"]:
        if ind.lower() in text.lower():
            params["industry"] = ind
            break

    if not params["industry"]:
        params["industry"] = "Technology"

    return params


@router.post("/", response_model=Dict[str, Any])
async def create_sales_search_request(
    request_in: SalesRequestCreate,
    current_user: AuthUser = Depends(get_current_user),
    profile: ProfileResponse = Depends(get_current_profile),
    admin_db: Client = Depends(get_admin_db),
):
    """
    Initiates a new AI Sales search request.
    Extracts parameters, creates persistent sales_request, and queues a job.
    """
    tenant_id = profile.tenant_id
    user_id = profile.id

    parsed = parse_natural_language_query(request_in.request_text)
    if request_in.parsed_parameters:
        parsed.update(request_in.parsed_parameters)

    # 1. Create Sales Request in database
    sales_req = CRMRepository.create_sales_request(
        db=admin_db,
        tenant_id=tenant_id,
        user_id=user_id,
        request_text=request_in.request_text,
        parsed_parameters=parsed
    )

    if not sales_req:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create sales request record."
        )

    # 2. Create Job record
    job = CRMRepository.create_job(
        db=admin_db,
        tenant_id=tenant_id,
        request_id=sales_req["id"],
        job_type="LEAD_DISCOVERY",
        total_count=parsed.get("lead_count", 25)
    )

    # 3. Enqueue to Redis Queue / Background Worker Task
    from app.worker.queue import enqueue_sales_search
    task_id = enqueue_sales_search(
        request_id=sales_req["id"],
        job_id=job["id"],
        user_request=request_in.request_text,
        tenant_id=tenant_id,
        user_id=user_id,
        parsed_request=parsed
    )

    # 4. Audit log event
    AuditService.log_event(
        db=admin_db,
        tenant_id=tenant_id,
        user_id=user_id,
        action="ENQUEUE_SALES_SEARCH",
        resource_type="sales_requests",
        resource_id=sales_req["id"],
        metadata={
            "prompt": request_in.request_text,
            "parsed": parsed,
            "job_id": str(job["id"]),
            "task_id": task_id
        }
    )

    return {
        "sales_request": sales_req,
        "job": job,
        "parsed_parameters": parsed,
        "task_id": task_id,
        "message": "AI Sales Search job accepted and enqueued for background execution."
    }


@router.post("/{request_id}/run")
async def rerun_sales_search_pipeline(
    request_id: UUID,
    profile: ProfileResponse = Depends(get_current_profile),
    admin_db: Client = Depends(get_admin_db),
):
    """
    Manually re-enqueues the LangGraph background job for an existing search request.
    """
    sales_req = CRMRepository.get_sales_request(db=admin_db, request_id=request_id)
    if not sales_req or str(sales_req["tenant_id"]) != str(profile.tenant_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Search request not found.")

    # Create new Job record
    job = CRMRepository.create_job(
        db=admin_db,
        tenant_id=profile.tenant_id,
        request_id=request_id,
        job_type="LEAD_DISCOVERY",
        total_count=sales_req.get("parsed_parameters", {}).get("lead_count", 25)
    )

    from app.worker.queue import enqueue_sales_search
    task_id = enqueue_sales_search(
        request_id=request_id,
        job_id=job["id"],
        user_request=sales_req["request_text"],
        tenant_id=profile.tenant_id,
        user_id=profile.id,
        parsed_request=sales_req.get("parsed_parameters", {})
    )

    return {
        "message": "Pipeline execution job enqueued",
        "job_id": job["id"],
        "task_id": task_id
    }


@router.get("/", response_model=List[Dict[str, Any]])
async def list_sales_searches(
    limit: int = 50,
    offset: int = 0,
    profile: ProfileResponse = Depends(get_current_profile),
    admin_db: Client = Depends(get_admin_db),
):
    """
    List previous sales searches with linked jobs and counts for current tenant.
    """
    searches = CRMRepository.list_sales_requests(
        db=admin_db,
        tenant_id=profile.tenant_id,
        limit=limit,
        offset=offset
    )

    results = []
    for s in searches:
        # Fetch associated job if any
        jobs_res = admin_db.table("jobs").select("*").eq("request_id", s["id"]).order("created_at", desc=True).limit(1).execute()
        job = jobs_res.data[0] if jobs_res.data else None
        
        # Count discovered leads
        leads_count_res = admin_db.table("leads").select("id", count="exact").eq("request_id", s["id"]).execute()
        leads_count = leads_count_res.count or 0

        results.append({
            **s,
            "job": job,
            "discovered_leads_count": leads_count
        })

    return results


@router.get("/{request_id}", response_model=Dict[str, Any])
async def get_search_details(
    request_id: UUID,
    profile: ProfileResponse = Depends(get_current_profile),
    admin_db: Client = Depends(get_admin_db),
):
    """
    Get detailed status of a specific search request and linked job executions.
    """
    sales_req = CRMRepository.get_sales_request(db=admin_db, request_id=request_id)
    if not sales_req or str(sales_req["tenant_id"]) != str(profile.tenant_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Search request not found.")

    jobs_res = admin_db.table("jobs").select("*").eq("request_id", str(request_id)).order("created_at", desc=True).execute()
    jobs = jobs_res.data or []

    # Get recent tool calls & agent executions for the job
    tool_calls = []
    agent_executions = []
    if jobs:
        latest_job_id = jobs[0]["id"]
        tc_res = admin_db.table("tool_calls").select("*").eq("job_id", latest_job_id).order("created_at").execute()
        tool_calls = tc_res.data or []

        ae_res = admin_db.table("agent_executions").select("*").eq("job_id", latest_job_id).order("created_at").execute()
        agent_executions = ae_res.data or []

    return {
        "sales_request": sales_req,
        "jobs": jobs,
        "tool_calls": tool_calls,
        "agent_executions": agent_executions
    }


@router.delete("/{request_id}", response_model=Dict[str, Any])
async def delete_sales_search_request(
    request_id: UUID,
    delete_leads: bool = True,
    profile: ProfileResponse = Depends(get_current_profile),
    admin_db: Client = Depends(get_admin_db),
):
    """
    Deletes a specific sales search request and cleans up linked jobs,
    tool calls, agent executions, and optionally associated leads.
    """
    tenant_id_str = str(profile.tenant_id)
    req_id_str = str(request_id)

    # 1. Verify existence and tenant ownership
    sales_req = CRMRepository.get_sales_request(db=admin_db, request_id=request_id)
    if not sales_req or str(sales_req.get("tenant_id")) != tenant_id_str:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Search request not found or access denied."
        )

    # 2. Optionally delete associated leads
    if delete_leads:
        try:
            admin_db.table("leads").delete().eq("request_id", req_id_str).eq("tenant_id", tenant_id_str).execute()
        except Exception as e:
            logger.warning(f"Error cleaning up leads for search {req_id_str}: {e}")

    # 3. Clean up jobs explicitly
    try:
        admin_db.table("jobs").delete().eq("request_id", req_id_str).eq("tenant_id", tenant_id_str).execute()
    except Exception as e:
        logger.warning(f"Error cleaning up jobs for search {req_id_str}: {e}")

    # 4. Delete the sales_request record
    admin_db.table("sales_requests").delete().eq("id", req_id_str).eq("tenant_id", tenant_id_str).execute()

    # 5. Log audit event
    AuditService.log_event(
        db=admin_db,
        tenant_id=profile.tenant_id,
        user_id=profile.id,
        action="DELETE_SALES_SEARCH",
        resource_type="sales_requests",
        resource_id=request_id,
        metadata={"prompt": sales_req.get("request_text"), "deleted_leads": delete_leads}
    )

    return {
        "status": "SUCCESS",
        "message": f"Search request {req_id_str} deleted successfully.",
        "request_id": req_id_str
    }
