import logging
from app.agents.state import SalesAgentState
from app.tools.discovery_tool import generate_mock_leads

logger = logging.getLogger(__name__)


def execute_node(state: SalesAgentState) -> SalesAgentState:
    """
    Node 4: EXECUTE
    Executes search/scraping tools to discover matching raw leads.
    """
    parsed = state.get("parsed_request", {})
    industry = parsed.get("industry", "Software")
    location = parsed.get("location", "Ahmedabad")
    job_title = parsed.get("job_title", "HR Manager")
    count = parsed.get("lead_count", 20)

    logger.info(f"[LangGraph:EXECUTE] Running discovery for {count} {job_title}s in {location} ({industry})...")

    raw_leads = generate_mock_leads(
        industry=industry,
        location=location,
        job_title=job_title,
        count=count
    )

    state["raw_leads"] = raw_leads
    state["current_stage"] = "EXECUTE"
    state["progress"] = 65
    logger.info(f"[LangGraph:EXECUTE] Successfully discovered {len(raw_leads)} raw prospect leads.")

    return state
