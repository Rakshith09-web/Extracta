import sys
import logging
from rq import Worker, Queue
from app.worker.queue import get_redis_connection

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("sales_agent_worker")

listen = ["sales_agent_queue"]


def start_worker():
    """
    Starts an RQ Worker process listening to sales_agent_queue.
    """
    redis_conn = get_redis_connection()
    if not redis_conn:
        logger.error("Could not connect to Redis. Worker exiting.")
        sys.exit(1)

    logger.info(f"Starting Sales Agent RQ Worker listening on queues: {listen}")
    queues = [Queue(q, connection=redis_conn) for q in listen]
    worker = Worker(queues, connection=redis_conn)
    worker.work()


if __name__ == "__main__":
    start_worker()
