import logging
from typing import Optional, Dict, Any
from uuid import UUID
import redis
from rq import Queue, Retry
from app.core.config import settings
import threading

logger = logging.getLogger(__name__)

_redis_conn: Optional[redis.Redis] = None
_redis_checked: bool = False
_job_queue: Optional[Queue] = None


def get_redis_connection() -> Optional[redis.Redis]:
    """
    Returns a synchronous Redis connection for RQ.
    Caches connection or offline state to prevent blocking on repeated calls.
    """
    global _redis_conn, _redis_checked
    if not _redis_checked:
        _redis_checked = True
        try:
            r = redis.from_url(settings.REDIS_URL, socket_timeout=0.5, socket_connect_timeout=0.5)
            r.ping()
            _redis_conn = r
        except Exception as e:
            logger.debug(f"Redis not available at {settings.REDIS_URL} ({e}). Using in-memory fallback.")
            _redis_conn = None
    return _redis_conn


def get_job_queue() -> Optional[Queue]:
    """
    Returns the primary RQ sales agent job queue.
    """
    global _job_queue
    conn = get_redis_connection()
    if conn and _job_queue is None:
        _job_queue = Queue("sales_agent_queue", connection=conn)
    return _job_queue


def enqueue_sales_search(
    request_id: UUID,
    job_id: UUID,
    user_request: str,
    tenant_id: UUID,
    user_id: UUID,
    parsed_request: Dict[str, Any]
) -> str:
    """
    Enqueues an AI sales search job into Redis Queue.
    Falls back to asynchronous threading if Redis is offline.
    """
    from app.worker.tasks import process_sales_search_job

    queue = get_job_queue()
    if queue:
        try:
            # Enqueue with RQ exponential backoff retry policy (3 retries)
            job = queue.enqueue(
                process_sales_search_job,
                args=(str(request_id), str(job_id), user_request, str(tenant_id), str(user_id), parsed_request),
                job_timeout=600,  # 10 minutes max execution
                retry=Retry(max=3, interval=[5, 15, 30])
            )
            logger.info(f"Successfully enqueued sales search job {job.id} to Redis Queue.")
            return job.id
        except Exception as e:
            logger.warning(f"Failed to enqueue to RQ ({e}). Running in background worker thread.")

    # Fallback thread runner for standalone development without Redis
    worker_thread = threading.Thread(
        target=process_sales_search_job,
        args=(str(request_id), str(job_id), user_request, str(tenant_id), str(user_id), parsed_request),
        daemon=True
    )
    worker_thread.start()
    logger.info(f"Spawned asynchronous background worker thread for job {job_id}.")
    return f"thread_{job_id}"
