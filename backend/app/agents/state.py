from typing import TypedDict, List, Dict, Any, Optional


class SalesAgentState(TypedDict):
    """
    Core state dictionary tracked across all LangGraph nodes.
    """
    user_request: str
    parsed_request: Dict[str, Any]
    selected_tools: List[str]
    raw_leads: List[Dict[str, Any]]
    validated_leads: List[Dict[str, Any]]
    enriched_leads: List[Dict[str, Any]]
    errors: List[str]
    request_id: str
    job_id: str
    tenant_id: str
    user_id: str
    current_stage: str
    progress: int
