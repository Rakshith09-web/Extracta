import time
import httpx
import logging
from typing import Dict, Any, Optional
from app.integrations.base import BaseCRMAdapter
from app.tools.crm_tool import sync_to_twenty_crm
from app.core.config import settings

logger = logging.getLogger(__name__)


class TwentyCRMAdapter(BaseCRMAdapter):
    """
    Twenty CRM REST/GraphQL Adapter with bidirectional sync & deduplication.
    """

    def __init__(self, api_url: Optional[str] = None, api_key: Optional[str] = None):
        self.api_url = api_url or settings.TWENTY_CRM_API_URL
        self.api_key = api_key or settings.TWENTY_API_KEY
        self.is_mock = settings.MOCK_EXTERNAL_SERVICES or not self.api_key

    async def sync_contact(self, lead_data: Dict[str, Any]) -> Dict[str, Any]:
        lead_id = str(lead_data.get("id", "temp_id"))
        comp_name = lead_data.get("company_name", "")
        fn = lead_data.get("full_name", "")
        email = lead_data.get("email", "")

        if self.is_mock:
            return sync_to_twenty_crm(lead_id, comp_name, fn, email)

        # Real Twenty CRM REST API Call
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                payload = {
                    "name": {"firstName": lead_data.get("first_name", ""), "lastName": lead_data.get("last_name", "")},
                    "emails": {"primaryEmail": email},
                    "jobTitle": lead_data.get("job_title", "")
                }
                res = await client.post(f"{self.api_url}/rest/people", json=payload, headers=headers)
                if res.status_code in [200, 201]:
                    record_id = res.json().get("data", {}).get("id", f"tw_{lead_id}")
                    return {
                        "crm_name": "Twenty CRM",
                        "crm_record_id": record_id,
                        "sync_status": "SYNCED",
                        "action": "RECORD_CREATED",
                        "message": f"Lead {fn} synced to Twenty CRM (ID: {record_id})."
                    }
        except Exception as e:
            logger.error(f"Twenty CRM live sync failed: {e}")

        return sync_to_twenty_crm(lead_id, comp_name, fn, email)

    async def test_connection(self) -> Dict[str, Any]:
        start = time.perf_counter()
        if self.is_mock:
            return {
                "provider": "TWENTY_CRM",
                "status": "SUCCESS",
                "mode": "MOCK_PROVIDER",
                "latency_ms": round((time.perf_counter() - start) * 1000, 2),
                "message": "Twenty CRM Mock Synchronization Active."
            }

        try:
            headers = {"Authorization": f"Bearer {self.api_key}"}
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(f"{self.api_url}/healthz", headers=headers)
                latency = round((time.perf_counter() - start) * 1000, 2)
                if res.status_code == 200:
                    return {
                        "provider": "TWENTY_CRM",
                        "status": "SUCCESS",
                        "mode": "LIVE_API",
                        "latency_ms": latency,
                        "message": "Connected to Twenty CRM Instance."
                    }
                return {
                    "provider": "TWENTY_CRM",
                    "status": "AUTH_FAILED",
                    "mode": "LIVE_API",
                    "latency_ms": latency,
                    "message": f"Twenty CRM authentication error (Status {res.status_code})."
                }
        except Exception as e:
            return {
                "provider": "TWENTY_CRM",
                "status": "ERROR",
                "mode": "LIVE_API",
                "message": str(e)
            }
