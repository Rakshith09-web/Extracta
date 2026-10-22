from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.schemas.profile import UserRole


class UserInviteRequest(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.SALES_REPRESENTATIVE
    password: Optional[str] = None  # If not provided, a secure temporary password is generated


class UserRoleUpdateRequest(BaseModel):
    role: UserRole


class UserStatusUpdateRequest(BaseModel):
    status: str  # ACTIVE, INACTIVE, SUSPENDED


class TenantUpdateRequest(BaseModel):
    name: str


class UserProfileUpdateRequest(BaseModel):
    full_name: str


class TeamMemberResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    full_name: Optional[str] = None
    email: EmailStr
    role: UserRole
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TenantDetailsResponse(BaseModel):
    id: UUID
    name: str
    status: str
    member_count: int
    created_at: datetime
    updated_at: datetime
