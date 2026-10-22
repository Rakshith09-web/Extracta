from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class TenantBase(BaseModel):
    name: str
    status: str = "ACTIVE"


class TenantCreate(TenantBase):
    pass


class TenantUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None


class TenantResponse(TenantBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
