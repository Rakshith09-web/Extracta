import time
import httpx
import logging
from typing import List, Dict, Any, Optional
from app.integrations.base import BaseDiscoveryAdapter, BaseEnrichmentAdapter
from app.tools.discovery_tool import generate_mock_leads
from app.tools.enrichment_tool import enrich_lead_intelligence
from app.core.config import settings

logger = logging.getLogger(__name__)


class ApolloAdapter(BaseDiscoveryAdapter, BaseEnrichmentAdapter):
    """
    Apollo.io Lead Discovery & Enrichment Adapter with Live API and Mock fallback.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.APOLLO_API_KEY
        self.is_mock = settings.MOCK_EXTERNAL_SERVICES or not self.api_key
        self.base_url = "https://api.apollo.io/v1"

    async def discover_leads(
        self,
        industry: str,
        location: str,
        job_title: str,
        limit: int = 25
    ) -> List[Dict[str, Any]]:
        if self.is_mock:
            logger.info(f"[ApolloAdapter:Mock] Generating {limit} mock leads for {job_title} in {location} ({industry}).")
            return generate_mock_leads(industry=industry, location=location, job_title=job_title, count=limit)

        # Real Apollo.io API Call
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                payload = {
                    "api_key": self.api_key,
                    "q_organization_domains": [],
                    "person_titles": [job_title] if job_title else [],
                    "person_locations": [location] if location else [],
                    "page": 1,
                    "per_page": limit
                }
                res = await client.post(f"{self.base_url}/mixed_people/search", json=payload)
                if res.status_code == 200:
                    data = res.json()
                    people = data.get("people", [])
                    normalized = []
                    for p in people:
                        fn = p.get("first_name", "")
                        ln = p.get("last_name", "")
                        org = p.get("organization", {}) or {}
                        normalized.append({
                            "first_name": fn,
                            "last_name": ln,
                            "full_name": f"{fn} {ln}".strip(),
                            "email": p.get("email"),
                            "phone": p.get("sanitized_phone"),
                            "company_name": org.get("name", "Unknown Company"),
                            "job_title": p.get("title", job_title),
                            "industry": org.get("industry", industry),
                            "location": f"{p.get('city', '')}, {p.get('state', '')}".strip(", "),
                            "company_size": org.get("estimated_num_employees", "50-250"),
                            "source": "APOLLO_API_LIVE",
                            "raw_data": {"apollo_id": p.get("id"), "linkedin_url": p.get("linkedin_url")}
                        })
                    return normalized
                else:
                    logger.warning(f"Apollo API returned status {res.status_code}. Falling back to mock generator.")
                    return generate_mock_leads(industry=industry, location=location, job_title=job_title, count=limit)
        except Exception as e:
            logger.error(f"Error querying Apollo API: {e}. Using mock discovery.")
            return generate_mock_leads(industry=industry, location=location, job_title=job_title, count=limit)

    async def enrich_contact(self, company_name: str, full_name: str, email: Optional[str] = None) -> Dict[str, Any]:
        if self.is_mock:
            return enrich_lead_intelligence(company_name, full_name)

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(
                    f"{self.base_url}/organizations/enrich",
                    params={"api_key": self.api_key, "domain": email.split('@')[1] if email and '@' in email else None}
                )
                if res.status_code == 200:
                    data = res.json()
                    org = data.get("organization", {})
                    return {
                        "annual_revenue": org.get("annual_revenue_printed"),
                        "tech_stack": org.get("current_technologies", ["Cloud", "React"]),
                        "company_funding": org.get("latest_funding_round_date"),
                        "linkedin_url": org.get("linkedin_url"),
                        "provider": "Apollo.io Live Intelligence"
                    }
        except Exception as e:
            logger.warning(f"Apollo enrichment failed ({e}). Returning simulated intelligence.")
        return enrich_lead_intelligence(company_name, full_name)

    async def test_connection(self) -> Dict[str, Any]:
        start = time.perf_counter()
        if self.is_mock:
            return {
                "provider": "APOLLO",
                "status": "SUCCESS",
                "mode": "MOCK_PROVIDER",
                "latency_ms": round((time.perf_counter() - start) * 1000, 2),
                "message": "Connected to Apollo.io High-Fidelity Mock Simulator."
            }

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(f"{self.base_url}/auth/health", params={"api_key": self.api_key})
                latency = round((time.perf_counter() - start) * 1000, 2)
                if res.status_code == 200:
                    return {
                        "provider": "APOLLO",
                        "status": "SUCCESS",
                        "mode": "LIVE_API",
                        "latency_ms": latency,
                        "message": "Successfully authenticated with Apollo.io API."
                    }
                return {
                    "provider": "APOLLO",
                    "status": "AUTH_FAILED",
                    "mode": "LIVE_API",
                    "latency_ms": latency,
                    "message": f"Apollo API key rejected (Status {res.status_code})."
                }
        except Exception as e:
            return {
                "provider": "APOLLO",
                "status": "ERROR",
                "mode": "LIVE_API",
                "message": str(e)
            }
