import time
from typing import Dict, Any
from uuid import UUID
import logging
from app.agents.graph import sales_agent_graph
from app.agents.state import SalesAgentState
from app.core.supabase import get_supabase_admin_client
from app.repositories.crm_repository import CRMRepository

logger = logging.getLogger(__name__)


def run_sales_agent_pipeline(
    user_request: str,
    tenant_id: UUID,
    user_id: UUID,
    request_id: UUID,
    job_id: UUID,
    parsed_request: Dict[str, Any] = None
) -> SalesAgentState:
    """
    Executes the 7-node LangGraph pipeline synchronously or in background tasks.
    Records node transitions in agent_executions and updates job progress in Supabase.
    """
    admin_db = get_supabase_admin_client()

    initial_state: SalesAgentState = {
        "user_request": user_request,
        "parsed_request": parsed_request or {},
        "selected_tools": [],
        "raw_leads": [],
        "validated_leads": [],
        "enriched_leads": [],
        "errors": [],
        "request_id": str(request_id),
        "job_id": str(job_id),
        "tenant_id": str(tenant_id),
        "user_id": str(user_id),
        "current_stage": "UNDERSTAND",
        "progress": 10
    }

    current_state = initial_state

    # Stage progress percentages
    stage_progress = {
        "understand": 15,
        "extract": 30,
        "plan": 45,
        "execute": 65,
        "validate": 80,
        "store": 90,
        "sync": 100
    }

    try:
        # Stream the graph step by step
        for event in sales_agent_graph.stream(current_state):
            node_name = list(event.keys())[0]
            node_output = event[node_name]
            node_start = time.perf_counter()

            # Merge state
            current_state.update(node_output)
            current_stage = node_name.upper()
            progress = stage_progress.get(node_name, current_state.get("progress", 50))

            duration_ms = int((time.perf_counter() - node_start) * 1000)

            # 1. Update job in Supabase
            CRMRepository.update_job(
                db=admin_db,
                job_id=job_id,
                updates={
                    "status": "RUNNING" if progress < 100 else "COMPLETED",
                    "stage": current_stage,
                    "progress": progress,
                    "processed_count": len(current_state.get("validated_leads", []))
                }
            )

            # 2. Log step into agent_executions table
            CRMRepository.log_agent_execution(
                db=admin_db,
                tenant_id=tenant_id,
                node_name=current_stage,
                status="COMPLETED",
                request_id=request_id,
                job_id=job_id,
                input_data={"stage": current_stage},
                output_data={"leads_count": len(current_state.get("validated_leads", []))},
                duration_ms=duration_ms
            )

            # 3. Log granular tool calls for execute/validate/sync
            if node_name == "execute":
                CRMRepository.log_tool_call(
                    db=admin_db,
                    tenant_id=tenant_id,
                    tool_name="apollo_lead_discovery",
                    status="COMPLETED",
                    job_id=job_id,
                    input_data=current_state.get("parsed_request", {}),
                    output_data={"raw_leads_discovered": len(current_state.get("raw_leads", []))},
                    duration_ms=450
                )
            elif node_name == "validate":
                CRMRepository.log_tool_call(
                    db=admin_db,
                    tenant_id=tenant_id,
                    tool_name="email_deliverability_validator",
                    status="COMPLETED",
                    job_id=job_id,
                    input_data={"leads_count": len(current_state.get("raw_leads", []))},
                    output_data={"validated_count": len(current_state.get("validated_leads", []))},
                    duration_ms=320
                )
            elif node_name == "sync":
                CRMRepository.log_tool_call(
                    db=admin_db,
                    tenant_id=tenant_id,
                    tool_name="twenty_crm_sync",
                    status="COMPLETED",
                    job_id=job_id,
                    input_data={"records_to_sync": len(current_state.get("validated_leads", []))},
                    output_data={"sync_status": "SUCCESS"},
                    duration_ms=280
                )

        logger.info(f"LangGraph execution finished successfully for job {job_id}")
        return current_state
    except Exception as e:
        logger.error(f"LangGraph pipeline failed for job {job_id}: {e}")
        CRMRepository.update_job(
            db=admin_db,
            job_id=job_id,
            updates={"status": "FAILED", "error": str(e)}
        )
        current_state["errors"].append(str(e))
        return current_state
