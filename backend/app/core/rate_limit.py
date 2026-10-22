import time
import logging
from typing import Optional
from collections import defaultdict, deque
from fastapi import Request, HTTPException, status
from app.worker.queue import get_redis_connection

logger = logging.getLogger(__name__)

# In-memory fallback sliding window cache
_memory_windows = defaultdict(deque)


def check_rate_limit(
    request: Request,
    max_requests: int = 60,
    window_seconds: int = 60,
    key_prefix: str = "rate_limit"
) -> bool:
    """
    Sliding window rate limiter backed by Redis with in-memory fallback.
    Identifies clients by User-Agent/IP or Authorization Header.
    """
    # Identify client
    client_ip = request.client.host if request.client else "127.0.0.1"
    auth_header = request.headers.get("Authorization", "")
    client_key = f"{key_prefix}:{auth_header[-16:] if len(auth_header) > 16 else client_ip}"

    now = time.time()
    redis_conn = get_redis_connection()

    if redis_conn:
        try:
            pipe = redis_conn.pipeline()
            # Remove timestamps older than window
            pipe.zremrangebyscore(client_key, 0, now - window_seconds)
            # Add current timestamp
            pipe.zadd(client_key, {str(now): now})
            # Count elements in window
            pipe.zcard(client_key)
            # Set TTL on key
            pipe.expire(client_key, window_seconds + 5)
            results = pipe.execute()

            request_count = results[2]
            if request_count > max_requests:
                logger.warning(f"Rate limit exceeded for {client_key} ({request_count}/{max_requests} reqs)")
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Too many requests. Rate limit is {max_requests} requests per {window_seconds} seconds.",
                    headers={"Retry-After": str(window_seconds)}
                )
            return True
        except HTTPException:
            raise
        except Exception as e:
            logger.debug(f"Redis rate limiter fallback to in-memory: {e}")

    # In-memory fallback
    window = _memory_windows[client_key]
    while window and window[0] <= now - window_seconds:
        window.popleft()

    if len(window) >= max_requests:
        logger.warning(f"In-memory rate limit exceeded for {client_key}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many requests. Rate limit is {max_requests} requests per {window_seconds} seconds.",
            headers={"Retry-After": str(window_seconds)}
        )

    window.append(now)
    return True


async def standard_rate_limiter(request: Request):
    """Dependency: 60 requests/minute"""
    check_rate_limit(request, max_requests=60, window_seconds=60, key_prefix="std_api")


async def search_rate_limiter(request: Request):
    """Dependency for AI Search: 15 searches/minute"""
    check_rate_limit(request, max_requests=15, window_seconds=60, key_prefix="ai_search")
