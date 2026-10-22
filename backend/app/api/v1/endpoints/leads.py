from typing import List, Optional, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import Client
from app.api.deps import get_current_user, get_current_profile, get_admin_db
from app.schemas.auth import AuthUser
from app.schemas.profile import ProfileResponse
from app.schemas.crm import LeadResponse, LeadUpdate, LeadCreate, LeadStatus
from app.repositories.crm_repository import CRMRepository
from app.services.audit_service import AuditService
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/stats", response_model=Dict[str, int])
async def get_lead_stats(
    profile: ProfileResponse = Depends(get_current_profile),
    admin_db: Client = Depends(get_admin_db),
):
    """
    Get summary statistics for dashboard metrics:
    Total leads, Validated emails, Enriched leads, and Synced to CRM.
    """
    tenant_id_str = str(profile.tenant_id)
    try:
        total_res = admin_db.table("leads").select("id", count="exact").eq("tenant_id", tenant_id_str).execute()
        valid_res = admin_db.table("leads").select("id", count="exact").eq("tenant_id", tenant_id_str).eq("validation_status", "VALID").execute()
        enrich_res = admin_db.table("leads").select("id", count="exact").eq("tenant_id", tenant_id_str).eq("enrichment_status", "ENRICHED").execute()
        synced_res = admin_db.table("leads").select("id", count="exact").eq("tenant_id", tenant_id_str).eq("lead_status", "SYNCED_TO_CRM").execute()
        searches_res = admin_db.table("sales_requests").select("id", count="exact").eq("tenant_id", tenant_id_str).execute()

        return {
            "total_leads": total_res.count or 0,
            "validated_leads": valid_res.count or 0,
            "enriched_leads": enrich_res.count or 0,
            "synced_leads": synced_res.count or 0,
            "total_searches": searches_res.count or 0
        }
    except Exception as e:
        logger.error(f"Error fetching lead stats: {e}")
        return {
            "total_leads": 0,
            "validated_leads": 0,
            "enriched_leads": 0,
            "synced_leads": 0,
            "total_searches": 0
        }


@router.get("/", response_model=List[LeadResponse])
async def list_leads(
    query: Optional[str] = None,
    lead_status: Optional[str] = None,
    validation_status: Optional[str] = None,
    enrichment_status: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    profile: ProfileResponse = Depends(get_current_profile),
    admin_db: Client = Depends(get_admin_db),
):
    """
    List organization leads with search and filter capabilities.
    """
    tenant_id_str = str(profile.tenant_id)
    builder = admin_db.table("leads").select("*").eq("tenant_id", tenant_id_str)

    if lead_status:
        builder = builder.eq("lead_status", lead_status)
    if validation_status:
        builder = builder.eq("validation_status", validation_status)
    if enrichment_status:
        builder = builder.eq("enrichment_status", enrichment_status)
    if query:
        builder = builder.or_(f"full_name.ilike.%{query}%,company_name.ilike.%{query}%,email.ilike.%{query}%,industry.ilike.%{query}%")

    res = builder.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    return res.data or []


@router.get("/{lead_id}", response_model=Dict[str, Any])
async def get_lead_details(
    lead_id: UUID,
    profile: ProfileResponse = Depends(get_current_profile),
    admin_db: Client = Depends(get_admin_db),
):
    """
    Retrieve single lead with detailed validation logs, enrichment metadata, and CRM mapping records.
    """
    tenant_id_str = str(profile.tenant_id)
    lead_res = admin_db.table("leads").select("*").eq("id", str(lead_id)).eq("tenant_id", tenant_id_str).single().execute()
    if not lead_res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found.")

    lead = lead_res.data

    # Fetch child tables
    val_res = admin_db.table("lead_validations").select("*").eq("lead_id", str(lead_id)).execute()
    enrich_res = admin_db.table("lead_enrichments").select("*").eq("lead_id", str(lead_id)).execute()
    map_res = admin_db.table("lead_mappings").select("*").eq("lead_id", str(lead_id)).execute()

    return {
        "lead": lead,
        "validations": val_res.data or [],
        "enrichments": enrich_res.data or [],
        "mappings": map_res.data or []
    }


@router.patch("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: UUID,
    lead_update: LeadUpdate,
    profile: ProfileResponse = Depends(get_current_profile),
    admin_db: Client = Depends(get_admin_db),
):
    """
    Update lead record (status, metadata, contact info).
    """
    tenant_id_str = str(profile.tenant_id)
    lead_id_str = str(lead_id)

    updates = {k: v for k, v in lead_update.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No updates provided.")

    res = admin_db.table("leads").update(updates).eq("id", lead_id_str).eq("tenant_id", tenant_id_str).execute()
    if not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found or update failed.")

    AuditService.log_event(
        db=admin_db,
        tenant_id=profile.tenant_id,
        user_id=profile.id,
        action="UPDATE_LEAD",
        resource_type="leads",
        resource_id=lead_id,
        metadata={"updates": updates}
    )

    return res.data[0]


@router.delete("/{lead_id}")
async def delete_lead(
    lead_id: UUID,
    profile: ProfileResponse = Depends(get_current_profile),
    admin_db: Client = Depends(get_admin_db),
):
    """
    Delete a lead record from the organization database.
    """
    tenant_id_str = str(profile.tenant_id)
    lead_id_str = str(lead_id)

    res = admin_db.table("leads").delete().eq("id", lead_id_str).eq("tenant_id", tenant_id_str).execute()
    if not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found.")

    AuditService.log_event(
        db=admin_db,
        tenant_id=profile.tenant_id,
        user_id=profile.id,
        action="DELETE_LEAD",
        resource_type="leads",
        resource_id=lead_id
    )

    return {"message": "Lead deleted successfully", "id": lead_id_str}


@router.post("/seed-mock", response_model=Dict[str, Any])
async def seed_mock_leads(
    profile: ProfileResponse = Depends(get_current_profile),
    admin_db: Client = Depends(get_admin_db),
):
    """
    Populates sample high-quality AI-discovered leads for Phase 4 UI testing.
    """
    tenant_id_str = str(profile.tenant_id)
    
    sample_leads = [
        {
            "tenant_id": tenant_id_str,
            "first_name": "Aarav",
            "last_name": "Patel",
            "full_name": "Aarav Patel",
            "email": "aarav.patel@infotech-solutions.in",
            "phone": "+91 98250 12345",
            "company_name": "InfoTech Solutions Ltd",
            "job_title": "Head of Human Resources",
            "industry": "Software / IT",
            "location": "Ahmedabad, Gujarat",
            "company_size": "250-500",
            "source": "AI_APOLLO_DISCOVERY",
            "email_status": "VERIFIED",
            "validation_status": "VALID",
            "enrichment_status": "ENRICHED",
            "lead_status": "APPROVED",
            "raw_data": {"apollo_id": "apl_89211", "tech_stack": ["React", "Python", "AWS"]}
        },
        {
            "tenant_id": tenant_id_str,
            "first_name": "Pooja",
            "last_name": "Shah",
            "full_name": "Pooja Shah",
            "email": "pooja.shah@cloudscale.io",
            "phone": "+91 98795 67890",
            "company_name": "CloudScale Systems",
            "job_title": "Senior Talent Acquisition Manager",
            "industry": "SaaS / Cloud",
            "location": "Ahmedabad, Gujarat",
            "company_size": "50-100",
            "source": "AI_APIFY_DISCOVERY",
            "email_status": "VERIFIED",
            "validation_status": "VALID",
            "enrichment_status": "ENRICHED",
            "lead_status": "SYNCED_TO_CRM",
            "raw_data": {"apollo_id": "apl_99120", "tech_stack": ["Node.js", "Kubernetes"]}
        },
        {
            "tenant_id": tenant_id_str,
            "first_name": "Rohan",
            "last_name": "Mehta",
            "full_name": "Rohan Mehta",
            "email": "rohan.m@quantumbyte.co",
            "phone": "+91 99099 44321",
            "company_name": "QuantumByte AI",
            "job_title": "HR Director",
            "industry": "Artificial Intelligence",
            "location": "Ahmedabad, Gujarat",
            "company_size": "100-250",
            "source": "AI_DISCOVERY",
            "email_status": "VERIFIED",
            "validation_status": "VALID",
            "enrichment_status": "PENDING",
            "lead_status": "REVIEWED",
            "raw_data": {"tech_stack": ["PyTorch", "FastAPI"]}
        },
        {
            "tenant_id": tenant_id_str,
            "first_name": "Ananya",
            "last_name": "Desai",
            "full_name": "Ananya Desai",
            "email": "ananya.d@novapaytech.com",
            "phone": "+91 97234 55678",
            "company_name": "NovaPay Financial",
            "job_title": "VP People & Culture",
            "industry": "Fintech",
            "location": "Ahmedabad, Gujarat",
            "company_size": "500-1000",
            "source": "AI_DISCOVERY",
            "email_status": "UNVERIFIED",
            "validation_status": "PENDING",
            "enrichment_status": "PENDING",
            "lead_status": "NEW",
            "raw_data": {}
        }
    ]

    res = admin_db.table("leads").insert(sample_leads).execute()
    created_leads = res.data or []

    # Insert sample validation and enrichment records for the first lead
    if created_leads:
        lead_id = created_leads[0]["id"]
        admin_db.table("lead_validations").insert({
            "lead_id": lead_id,
            "validation_type": "SMTP_MX_VERIFICATION",
            "status": "VALID",
            "provider": "Mock Email Validator",
            "result": {"deliverable": True, "mx_record": "mail.infotech-solutions.in", "score": 0.98}
        }).execute()

        admin_db.table("lead_enrichments").insert({
            "lead_id": lead_id,
            "provider": "Apollo.io Mock Provider",
            "result": {"funding_raised": "$12M Series A", "linkedin_url": "https://linkedin.com/in/mock-aarav-patel"}
        }).execute()

        admin_db.table("lead_mappings").insert({
            "tenant_id": tenant_id_str,
            "lead_id": lead_id,
            "crm_name": "Twenty CRM",
            "crm_record_id": "twenty_rec_88321",
            "sync_status": "SYNCED"
        }).execute()

    return {
        "message": f"Successfully populated {len(created_leads)} sample leads with validations and enrichments!",
        "count": len(created_leads)
    }
