import logging
from datetime import datetime, timezone
from app.agents.state import SalesAgentState
from app.core.supabase import get_supabase_admin_client
from app.tools.crm_tool import sync_to_twenty_crm, export_to_google_sheets

logger = logging.getLogger(__name__)


def sync_node(state: SalesAgentState) -> SalesAgentState:
    """
    Node 7: SYNC
    Synchronizes qualified leads with Twenty CRM and generates Google Sheets review mapping.
    """
    leads = state.get("validated_leads", [])
    tenant_id = state.get("tenant_id")
    job_id = state.get("job_id")
    request_id = state.get("request_id")

    logger.info(f"[LangGraph:SYNC] Running CRM and Sheets sync for {len(leads)} leads...")

    if not leads or not tenant_id:
        state["current_stage"] = "SYNC"
        state["progress"] = 100
        return state

    try:
        admin_db = get_supabase_admin_client()

        # 1. Twenty CRM record creation & mapping
        for lead in leads:
            lead_id = lead.get("id")
            if not lead_id:
                continue

            sync_res = sync_to_twenty_crm(
                lead_id=str(lead_id),
                company_name=lead.get("company_name", ""),
                full_name=lead.get("full_name", ""),
                email=lead.get("email", "")
            )

            admin_db.table("lead_mappings").insert({
                "tenant_id": tenant_id,
                "lead_id": str(lead_id),
                "crm_name": sync_res["crm_name"],
                "crm_record_id": sync_res["crm_record_id"],
                "sync_status": sync_res["sync_status"]
            }).execute()

        # 2. Google Sheets batch review link
        sheet_res = export_to_google_sheets(
            leads_count=len(leads),
            sheet_title=f"Discovered Leads - {datetime.now(timezone.utc).strftime('%Y-%m-%d')}"
        )

        # 3. Update Job and Sales Request status to COMPLETED
        now_str = datetime.now(timezone.utc).isoformat()
        if job_id:
            admin_db.table("jobs").update({
                "status": "COMPLETED",
                "stage": "SYNC",
                "progress": 100,
                "processed_count": len(leads),
                "completed_at": now_str
            }).eq("id", str(job_id)).execute()

        if request_id:
            admin_db.table("sales_requests").update({
                "status": "COMPLETED",
                "completed_at": now_str
            }).eq("id", str(request_id)).execute()

        logger.info("[LangGraph:SYNC] CRM synchronization and job completion successful.")
    except Exception as e:
        logger.error(f"[LangGraph:SYNC] Error in sync node: {e}")
        state["errors"].append(f"Sync error: {str(e)}")

    state["current_stage"] = "SYNC"
    state["progress"] = 100

    return state
