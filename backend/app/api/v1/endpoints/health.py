import time
from datetime import datetime, timezone
from fastapi import APIRouter
import redis.asyncio as aioredis
import httpx
from app.core.config import settings
from app.schemas.health import HealthResponse, ServiceStatus
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    System Health Check endpoint.
    Verifies FastAPI, Redis connectivity, and Supabase connectivity.
    """
    services = {}
    overall_status = "healthy"

    # 1. Check Redis
    redis_start = time.perf_counter()
    try:
        r = aioredis.from_url(settings.REDIS_URL, socket_connect_timeout=2.0)
        pong = await r.ping()
        await r.aclose()
        redis_latency = (time.perf_counter() - redis_start) * 1000
        services["redis"] = ServiceStatus(
            status="healthy" if pong else "unhealthy",
            latency_ms=round(redis_latency, 2),
            details="Connected successfully"
        )
    except Exception as e:
        logger.warning(f"Redis health check failed: {e}")
        services["redis"] = ServiceStatus(
            status="unhealthy" if not settings.MOCK_EXTERNAL_SERVICES else "mocked",
            latency_ms=None,
            details=str(e)
        )
        if not settings.MOCK_EXTERNAL_SERVICES:
            overall_status = "degraded"

    # 2. Check Supabase Connectivity
    supabase_start = time.perf_counter()
    try:
        from app.core.supabase import get_supabase_admin_client
        supabase = get_supabase_admin_client()
        # Query tenants table with limit 1 to verify database and credentials
        res = supabase.table("tenants").select("id").limit(1).execute()
        supabase_latency = (time.perf_counter() - supabase_start) * 1000
        services["supabase"] = ServiceStatus(
            status="healthy",
            latency_ms=round(supabase_latency, 2),
            details="Supabase Auth & Database responsive"
        )
    except Exception as e:
        logger.warning(f"Supabase client query check: {e}")
        # Secondary probe via HTTP
        try:
            headers = {
                "apikey": settings.SUPABASE_PUBLISHABLE_KEY,
                "Authorization": f"Bearer {settings.SUPABASE_PUBLISHABLE_KEY}"
            }
            async with httpx.AsyncClient(timeout=4.0) as client:
                resp = await client.get(f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/tenants?select=id&limit=1", headers=headers)
                supabase_latency = (time.perf_counter() - supabase_start) * 1000
                if resp.status_code < 400:
                    services["supabase"] = ServiceStatus(
                        status="healthy",
                        latency_ms=round(supabase_latency, 2),
                        details="Supabase Database responsive"
                    )
                else:
                    services["supabase"] = ServiceStatus(
                        status="degraded",
                        latency_ms=round(supabase_latency, 2),
                        details=f"HTTP {resp.status_code}"
                    )
        except Exception as http_err:
            logger.warning(f"Supabase HTTP check failed: {http_err}")
            services["supabase"] = ServiceStatus(
                status="unhealthy" if not settings.MOCK_EXTERNAL_SERVICES else "mocked",
                latency_ms=None,
                details=str(e)
            )

    # 3. FastAPI Service
    services["fastapi"] = ServiceStatus(
        status="healthy",
        latency_ms=0.1,
        details=f"FastAPI v{settings.VERSION}"
    )

    return HealthResponse(
        status=overall_status,
        timestamp=datetime.now(timezone.utc),
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        services=services
    )
