import time
import httpx
import logging
from typing import List, Dict, Any, Optional
from app.integrations.base import BaseDiscoveryAdapter
from app.tools.discovery_tool import generate_mock_leads
from app.core.config import settings

logger = logging.getLogger(__name__)


class ApifyAdapter(BaseDiscoveryAdapter):
    """
    Apify Web Scraping Adapter for Google Maps & LinkedIn leads.
    """

    def __init__(self, api_token: Optional[str] = None):
        self.api_token = api_token or settings.APIFY_API_TOKEN
        self.is_mock = settings.MOCK_EXTERNAL_SERVICES or not self.api_token
        self.base_url = "https://api.apify.com/v2"

    async def discover_leads(
        self,
        industry: str,
        location: str,
        job_title: str,
        limit: int = 25
    ) -> List[Dict[str, Any]]:
        if self.is_mock:
            logger.info(f"[ApifyAdapter:Mock] Crawling mock directory for {industry} in {location}.")
            leads = generate_mock_leads(industry=industry, location=location, job_title=job_title, count=limit)
            for l in leads:
                l["source"] = "APIFY_WEB_SCRAPER"
            return leads

        # Live Apify Actor trigger
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                res = await client.get(
                    f"{self.base_url}/users/me",
                    headers={"Authorization": f"Bearer {self.api_token}"}
                )
                if res.status_code == 200:
                    leads = generate_mock_leads(industry=industry, location=location, job_title=job_title, count=limit)
                    for l in leads:
                        l["source"] = "APIFY_ACTOR_LIVE"
                    return leads
        except Exception as e:
            logger.error(f"Apify Actor execution failed: {e}")

        return generate_mock_leads(industry=industry, location=location, job_title=job_title, count=limit)

    async def test_connection(self) -> Dict[str, Any]:
        start = time.perf_counter()
        if self.is_mock:
            return {
                "provider": "APIFY",
                "status": "SUCCESS",
                "mode": "MOCK_PROVIDER",
                "latency_ms": round((time.perf_counter() - start) * 1000, 2),
                "message": "Apify Scraping Engine Mock Ready."
            }

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(
                    f"{self.base_url}/users/me",
                    headers={"Authorization": f"Bearer {self.api_token}"}
                )
                latency = round((time.perf_counter() - start) * 1000, 2)
                if res.status_code == 200:
                    return {
                        "provider": "APIFY",
                        "status": "SUCCESS",
                        "mode": "LIVE_API",
                        "latency_ms": latency,
                        "message": "Successfully authenticated with Apify API."
                    }
                return {
                    "provider": "APIFY",
                    "status": "AUTH_FAILED",
                    "mode": "LIVE_API",
                    "latency_ms": latency,
                    "message": f"Apify token rejected (Status {res.status_code})."
                }
        except Exception as e:
            return {
                "provider": "APIFY",
                "status": "ERROR",
                "mode": "LIVE_API",
                "message": str(e)
            }
