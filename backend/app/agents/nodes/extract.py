import re
import logging
from app.agents.state import SalesAgentState

logger = logging.getLogger(__name__)


def extract_node(state: SalesAgentState) -> SalesAgentState:
    """
    Node 2: EXTRACT
    Extracts structured search criteria: industry, location, job_title, lead_count, email_required.
    """
    text = state.get("user_request", "")
    logger.info(f"[LangGraph:EXTRACT] Extracting criteria from prompt...")

    parsed = state.get("parsed_request", {}) or {}

    # Extract count
    if not parsed.get("lead_count"):
        count_match = re.search(r'\b(\d+)\b', text)
        parsed["lead_count"] = min(int(count_match.group(1)), 100) if count_match else 20

    # Extract location
    if not parsed.get("location"):
        loc_match = re.search(r'\bin\s+([A-Za-z\s]+?)(?:\s+and|\s+with|\.|$)', text, re.IGNORECASE)
        parsed["location"] = loc_match.group(1).strip() if loc_match else "Ahmedabad, Gujarat"

    # Extract job title
    if not parsed.get("job_title"):
        title_match = re.search(r'\b(?:their|find)\s+([A-Za-z\s]+?(?:manager|director|lead|officer|engineer|vp|head|ceo|cto|founder))', text, re.IGNORECASE)
        if title_match:
            parsed["job_title"] = title_match.group(1).strip()
        elif "hr" in text.lower():
            parsed["job_title"] = "HR Manager"
        else:
            parsed["job_title"] = "Decision Maker"

    # Extract industry
    if not parsed.get("industry"):
        for ind in ["Software", "IT", "Healthcare", "Fintech", "Real Estate", "Manufacturing", "E-commerce", "SaaS"]:
            if ind.lower() in text.lower():
                parsed["industry"] = ind
                break
        if not parsed.get("industry"):
            parsed["industry"] = "Technology"

    parsed["email_required"] = True

    state["parsed_request"] = parsed
    state["current_stage"] = "EXTRACT"
    state["progress"] = 30
    logger.info(f"[LangGraph:EXTRACT] Extracted parameters: {parsed}")

    return state
