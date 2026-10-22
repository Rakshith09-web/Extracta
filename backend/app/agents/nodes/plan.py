import logging
from app.agents.state import SalesAgentState

logger = logging.getLogger(__name__)


def plan_node(state: SalesAgentState) -> SalesAgentState:
    """
    Node 3: PLAN
    Selects the sequence of tools required based on the extracted request criteria.
    """
    parsed = state.get("parsed_request", {})
    logger.info("[LangGraph:PLAN] Planning execution strategy and selecting tools...")

    tools = ["apollo_discovery_tool"]
    if parsed.get("email_required", True):
        tools.append("email_validation_tool")
    
    tools.append("lead_enrichment_tool")
    tools.append("twenty_crm_sync_tool")
    tools.append("google_sheets_tool")

    state["selected_tools"] = tools
    state["current_stage"] = "PLAN"
    state["progress"] = 45
    logger.info(f"[LangGraph:PLAN] Tools selected: {tools}")

    return state
