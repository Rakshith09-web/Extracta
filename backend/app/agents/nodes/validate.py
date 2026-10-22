import logging
from app.agents.state import SalesAgentState
from app.tools.validation_tool import validate_email_address
from app.tools.enrichment_tool import enrich_lead_intelligence

logger = logging.getLogger(__name__)


def validate_node(state: SalesAgentState) -> SalesAgentState:
    """
    Node 5: VALIDATE
    Deduplicates leads by email, runs deliverability validation, and enriches intelligence.
    """
    raw_leads = state.get("raw_leads", [])
    logger.info(f"[LangGraph:VALIDATE] Validating and deduplicating {len(raw_leads)} leads...")

    validated_leads = []
    enriched_leads = []
    seen_emails = set()

    for lead in raw_leads:
        email = lead.get("email")
        if not email or email in seen_emails:
            continue
        seen_emails.add(email)

        # 1. Deliverability validation test
        val_result = validate_email_address(email)
        lead["validation_result"] = val_result
        lead["validation_status"] = val_result["status"]
        lead["email_status"] = "VERIFIED" if val_result["status"] == "VALID" else "INVALID"

        # 2. Third-party enrichment
        enrich_result = enrich_lead_intelligence(lead.get("company_name", ""), lead.get("full_name", ""))
        lead["enrichment_result"] = enrich_result
        lead["enrichment_status"] = "ENRICHED"
        lead["lead_status"] = "APPROVED" if val_result["status"] == "VALID" else "REVIEWED"

        validated_leads.append(lead)
        enriched_leads.append(lead)

    state["validated_leads"] = validated_leads
    state["enriched_leads"] = enriched_leads
    state["current_stage"] = "VALIDATE"
    state["progress"] = 80
    logger.info(f"[LangGraph:VALIDATE] Completed validation: {len(validated_leads)} qualified leads ready for storage.")

    return state
