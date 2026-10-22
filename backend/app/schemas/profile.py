from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from uuid import UUID
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    SALES_MANAGER = "SALES_MANAGER"
    SALES_REPRESENTATIVE = "SALES_REPRESENTATIVE"


class ProfileBase(BaseModel):
    full_name: Optional[str] = None
    email: EmailStr
    role: UserRole = UserRole.SALES_REPRESENTATIVE
    status: str = "ACTIVE"


class ProfileCreate(ProfileBase):
    id: UUID
    tenant_id: UUID


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    status: Optional[str] = None


class ProfileResponse(ProfileBase):
    id: UUID
    tenant_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
