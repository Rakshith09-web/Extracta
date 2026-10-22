import logging
from app.agents.state import SalesAgentState
from app.core.supabase import get_supabase_admin_client

logger = logging.getLogger(__name__)


def store_node(state: SalesAgentState) -> SalesAgentState:
    """
    Node 6: STORE
    Persists validated leads, deliverability tests, and enrichments into Supabase PostgreSQL tables.
    """
    leads = state.get("validated_leads", [])
    tenant_id = state.get("tenant_id")
    request_id = state.get("request_id")

    logger.info(f"[LangGraph:STORE] Persisting {len(leads)} leads into Supabase PostgreSQL...")

    if not leads or not tenant_id:
        state["current_stage"] = "STORE"
        state["progress"] = 90
        return state

    try:
        admin_db = get_supabase_admin_client()
        stored_leads = []

        for lead in leads:
            val_res = lead.pop("validation_result", None)
            enrich_res = lead.pop("enrichment_result", None)

            lead_payload = {
                "tenant_id": tenant_id,
                "request_id": request_id,
                "first_name": lead.get("first_name"),
                "last_name": lead.get("last_name"),
                "full_name": lead.get("full_name"),
                "email": lead.get("email"),
                "phone": lead.get("phone"),
                "company_name": lead.get("company_name"),
                "job_title": lead.get("job_title"),
                "industry": lead.get("industry"),
                "location": lead.get("location"),
                "company_size": lead.get("company_size"),
                "source": lead.get("source", "AI_APOLLO_DISCOVERY"),
                "email_status": lead.get("email_status", "VERIFIED"),
                "validation_status": lead.get("validation_status", "VALID"),
                "enrichment_status": lead.get("enrichment_status", "ENRICHED"),
                "lead_status": lead.get("lead_status", "APPROVED"),
                "raw_data": lead.get("raw_data", {})
            }

            res = admin_db.table("leads").insert(lead_payload).execute()
            if res.data:
                saved_lead = res.data[0]
                saved_id = saved_lead["id"]
                saved_lead["validation_result"] = val_res
                saved_lead["enrichment_result"] = enrich_res
                stored_leads.append(saved_lead)

                # Persist validation record
                if val_res:
                    admin_db.table("lead_validations").insert({
                        "lead_id": saved_id,
                        "validation_type": "SMTP_MX_VERIFICATION",
                        "status": val_res.get("status", "VALID"),
                        "provider": val_res.get("provider", "Mock Validation Provider"),
                        "result": val_res
                    }).execute()

                # Persist enrichment record
                if enrich_res:
                    admin_db.table("lead_enrichments").insert({
                        "lead_id": saved_id,
                        "provider": enrich_res.get("provider", "Apollo.io Intelligence"),
                        "result": enrich_res
                    }).execute()

        state["validated_leads"] = stored_leads
        logger.info(f"[LangGraph:STORE] Successfully saved {len(stored_leads)} leads into database.")
    except Exception as e:
        logger.error(f"[LangGraph:STORE] Error saving leads: {e}")
        state["errors"].append(f"Storage error: {str(e)}")

    state["current_stage"] = "STORE"
    state["progress"] = 90

    return state
