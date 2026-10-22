import time
import httpx
import logging
from typing import Dict, Any, Optional
from app.integrations.base import BaseValidationAdapter
from app.tools.validation_tool import validate_email_address
from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailValidationAdapter(BaseValidationAdapter):
    """
    Email Deliverability & MX Verification Adapter.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.EMAIL_VALIDATION_API_KEY
        self.is_mock = settings.MOCK_EXTERNAL_SERVICES or not self.api_key

    async def validate_email(self, email: str) -> Dict[str, Any]:
        if self.is_mock:
            return validate_email_address(email)

        # Live Validation API Call (e.g. Hunter / ZeroBounce / Abstract API)
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(
                    "https://api.hunter.io/v2/email-verifier",
                    params={"email": email, "api_key": self.api_key}
                )
                if res.status_code == 200:
                    data = res.json().get("data", {})
                    is_valid = data.get("result") in ["deliverable", "risky"]
                    return {
                        "status": "VALID" if is_valid else "INVALID",
                        "is_deliverable": is_valid,
                        "score": data.get("score", 0.95) / 100.0,
                        "mx_found": data.get("mx_records", True),
                        "smtp_check": data.get("smtp_check", "OK"),
                        "provider": "Hunter.io Live Verifier"
                    }
        except Exception as e:
            logger.error(f"Live email validation failed: {e}")

        return validate_email_address(email)

    async def test_connection(self) -> Dict[str, Any]:
        start = time.perf_counter()
        if self.is_mock:
            return {
                "provider": "EMAIL_VALIDATION",
                "status": "SUCCESS",
                "mode": "MOCK_PROVIDER",
                "latency_ms": round((time.perf_counter() - start) * 1000, 2),
                "message": "Email Deliverability & MX Verification Engine Ready."
            }

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get("https://api.hunter.io/v2/account", params={"api_key": self.api_key})
                latency = round((time.perf_counter() - start) * 1000, 2)
                if res.status_code == 200:
                    return {
                        "provider": "EMAIL_VALIDATION",
                        "status": "SUCCESS",
                        "mode": "LIVE_API",
                        "latency_ms": latency,
                        "message": "Connected to Hunter.io Deliverability Engine."
                    }
                return {
                    "provider": "EMAIL_VALIDATION",
                    "status": "AUTH_FAILED",
                    "mode": "LIVE_API",
                    "latency_ms": latency,
                    "message": f"Verification API key rejected (Status {res.status_code})."
                }
        except Exception as e:
            return {
                "provider": "EMAIL_VALIDATION",
                "status": "ERROR",
                "mode": "LIVE_API",
                "message": str(e)
            }
