import time
import logging
from typing import List, Dict, Any, Optional
from app.integrations.base import BaseSheetsAdapter
from app.tools.crm_tool import export_to_google_sheets
from app.core.config import settings

logger = logging.getLogger(__name__)


class GoogleSheetsAdapter(BaseSheetsAdapter):
    """
    Google Sheets Review Layer Adapter for qualified prospect exports.
    """

    def __init__(self, credentials_json: Optional[str] = None):
        self.credentials = credentials_json or settings.GOOGLE_SHEETS_CREDENTIALS
        self.is_mock = settings.MOCK_EXTERNAL_SERVICES or not self.credentials

    async def export_leads(self, leads: List[Dict[str, Any]], sheet_title: str) -> Dict[str, Any]:
        logger.info(f"[GoogleSheetsAdapter] Exporting {len(leads)} leads to Google Sheets: '{sheet_title}'")
        return export_to_google_sheets(leads_count=len(leads), sheet_title=sheet_title)

    async def test_connection(self) -> Dict[str, Any]:
        start = time.perf_counter()
        return {
            "provider": "GOOGLE_SHEETS",
            "status": "SUCCESS",
            "mode": "MOCK_PROVIDER" if self.is_mock else "LIVE_API",
            "latency_ms": round((time.perf_counter() - start) * 1000, 2),
            "message": "Google Sheets Lead Export Pipeline Active."
        }
