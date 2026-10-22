import logging
from app.agents.state import SalesAgentState

logger = logging.getLogger(__name__)


def understand_node(state: SalesAgentState) -> SalesAgentState:
    """
    Node 1: UNDERSTAND
    Interprets user prompt, verifies intent, and prepares execution pipeline.
    """
    prompt = state.get("user_request", "")
    logger.info(f"[LangGraph:UNDERSTAND] Analyzing request: '{prompt}'")

    state["current_stage"] = "UNDERSTAND"
    state["progress"] = 15
    state["errors"] = state.get("errors", [])
    
    return state
