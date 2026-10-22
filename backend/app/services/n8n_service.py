import os
import httpx
import logging
from typing import Dict, Any, Optional
from uuid import UUID
from app.core.config import settings

logger = logging.getLogger(__name__)

N8N_BASE_URL = os.environ.get("N8N_WEBHOOK_BASE_URL", "http://n8n:5678/webhook")
WEBHOOK_SECRET = getattr(settings, "N8N_WEBHOOK_SECRET", "n8n_sales_crm_secure_webhook_secret_2026")


class N8nWorkflowService:
    """
    Client service for dispatching asynchronous tasks and trigger events
    from FastAPI to external n8n automation workflow pipelines.
    """

    @classmethod
    async def _post_webhook(
        cls,
        endpoint_path: str,
        payload: Dict[str, Any],
        timeout: float = 5.0
    ) -> Dict[str, Any]:
        """
        Sends an HTTP POST to n8n webhook with authenticated headers.
        """
        url = f"{N8N_BASE_URL.rstrip('/')}/{endpoint_path.lstrip('/')}"
        headers = {
            "Content-Type": "application/json",
            "X-Webhook-Secret": WEBHOOK_SECRET
        }

        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                res = await client.post(url, json=payload, headers=headers)
                if res.status_code in [200, 201, 202]:
                    return {"status": "SUCCESS", "status_code": res.status_code, "data": res.json() if res.content else {}}
                else:
                    logger.warning(f"n8n webhook {endpoint_path} returned status {res.status_code}: {res.text}")
                    return {"status": "FAILED", "status_code": res.status_code, "error": res.text}
        except httpx.ConnectError:
            logger.info(f"n8n server at {url} unreachable (simulating mock webhook dispatch).")
            return {"status": "SIMULATED", "message": f"Webhook {endpoint_path} simulated successfully."}
        except Exception as e:
            logger.error(f"Error dispatching n8n webhook {endpoint_path}: {e}")
            return {"status": "ERROR", "error": str(e)}

    @classmethod
    async def trigger_lead_enrichment(
        cls,
        lead_id: UUID,
        email: str,
        company_name: str,
        tenant_id: UUID,
        prospect_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Triggers the n8n Lead Enrichment pipeline.
        """
        payload = {
            "lead_id": str(lead_id),
            "email": email,
            "company_name": company_name,
            "prospect_name": prospect_name or "",
            "tenant_id": str(tenant_id),
            "source": "fastapi_sales_crm"
        }
        return await cls._post_webhook("lead-enrichment-trigger", payload)

    @classmethod
    async def trigger_crm_sync(
        cls,
        lead_id: UUID,
        tenant_id: UUID,
        crm_name: str = "Twenty CRM",
        lead_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Triggers the n8n CRM synchronization pipeline.
        """
        payload = {
            "lead_id": str(lead_id),
            "tenant_id": str(tenant_id),
            "crm_name": crm_name,
            "lead_data": lead_data or {},
            "source": "fastapi_sales_crm"
        }
        return await cls._post_webhook("crm-sync-trigger", payload)

    @classmethod
    async def send_pipeline_alert(
        cls,
        level: str,
        source: str,
        message: str,
        tenant_id: Optional[UUID] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Triggers the n8n Error & Incident Alerting pipeline.
        """
        payload = {
            "level": level.upper(),
            "source": source,
            "message": message,
            "tenant_id": str(tenant_id) if tenant_id else None,
            "context": context or {}
        }
        return await cls._post_webhook("alert-trigger", payload)
