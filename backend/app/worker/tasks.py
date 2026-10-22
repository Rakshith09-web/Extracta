import logging
from uuid import UUID
from app.agents.runner import run_sales_agent_pipeline
from app.core.supabase import get_supabase_admin_client
from app.repositories.crm_repository import CRMRepository

logger = logging.getLogger(__name__)


def process_sales_search_job(
    request_id_str: str,
    job_id_str: str,
    user_request: str,
    tenant_id_str: str,
    user_id_str: str,
    parsed_request: dict
):
    """
    Background worker task executed by RQ Worker or background thread.
    Runs the 7-stage LangGraph AI sales pipeline and streams updates to Supabase.
    """
    logger.info(f"[WorkerTask] Processing sales job {job_id_str} for tenant {tenant_id_str}...")

    request_id = UUID(request_id_str)
    job_id = UUID(job_id_str)
    tenant_id = UUID(tenant_id_str)
    user_id = UUID(user_id_str)

    admin_db = get_supabase_admin_client()

    try:
        # Mark status as RUNNING
        CRMRepository.update_job(
            db=admin_db,
            job_id=job_id,
            updates={
                "status": "RUNNING",
                "stage": "UNDERSTAND",
                "progress": 15
            }
        )

        # Execute LangGraph Pipeline
        final_state = run_sales_agent_pipeline(
            user_request=user_request,
            tenant_id=tenant_id,
            user_id=user_id,
            request_id=request_id,
            job_id=job_id,
            parsed_request=parsed_request
        )

        logger.info(f"[WorkerTask] Completed sales job {job_id_str} successfully. Discovered {len(final_state.get('validated_leads', []))} leads.")
        return {
            "status": "COMPLETED",
            "job_id": job_id_str,
            "leads_count": len(final_state.get("validated_leads", []))
        }
    except Exception as e:
        logger.error(f"[WorkerTask] Job {job_id_str} failed with error: {e}", exc_info=True)
        CRMRepository.update_job(
            db=admin_db,
            job_id=job_id,
            updates={
                "status": "FAILED",
                "error": str(e)
            }
        )
        raise e
