from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from uuid import UUID
from app.schemas.profile import ProfileResponse
from app.schemas.tenant import TenantResponse


class AuthUser(BaseModel):
    id: UUID
    email: EmailStr
    role: str = "authenticated"
    user_metadata: Dict[str, Any] = {}
    app_metadata: Dict[str, Any] = {}


class AuthenticatedUserContext(BaseModel):
    user: AuthUser
    profile: Optional[ProfileResponse] = None
    tenant: Optional[TenantResponse] = None
