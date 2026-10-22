from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime


class ServiceStatus(BaseModel):
    status: str
    latency_ms: Optional[float] = None
    details: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    version: str
    environment: str
    services: Dict[str, ServiceStatus]
