from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID
from enum import Enum


# ------------------------------------------------------------------------------
# Enums
# ------------------------------------------------------------------------------
class SalesRequestStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class JobStatus(str, Enum):
    PENDING = "PENDING"
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class EmailStatus(str, Enum):
    VERIFIED = "VERIFIED"
    UNVERIFIED = "UNVERIFIED"
    INVALID = "INVALID"
    RISKY = "RISKY"
    UNKNOWN = "UNKNOWN"


class ValidationStatus(str, Enum):
    PENDING = "PENDING"
    VALID = "VALID"
    INVALID = "INVALID"
    FAILED = "FAILED"


class EnrichmentStatus(str, Enum):
    PENDING = "PENDING"
    ENRICHED = "ENRICHED"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"


class LeadStatus(str, Enum):
    NEW = "NEW"
    REVIEWED = "REVIEWED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    SYNCED_TO_CRM = "SYNCED_TO_CRM"


class IntegrationProvider(str, Enum):
    TWENTY_CRM = "TWENTY_CRM"
    GOOGLE_SHEETS = "GOOGLE_SHEETS"
    APOLLO = "APOLLO"
    APIFY = "APIFY"
    EMAIL_VALIDATION = "EMAIL_VALIDATION"
    CUSTOM_WEBHOOK = "CUSTOM_WEBHOOK"


# ------------------------------------------------------------------------------
# 1. sales_requests
# ------------------------------------------------------------------------------
class SalesRequestBase(BaseModel):
    request_text: str
    parsed_parameters: Dict[str, Any] = Field(default_factory=dict)


class SalesRequestCreate(SalesRequestBase):
    pass


class SalesRequestResponse(SalesRequestBase):
    id: UUID
    tenant_id: UUID
    user_id: Optional[UUID] = None
    status: SalesRequestStatus
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ------------------------------------------------------------------------------
# 2. jobs
# ------------------------------------------------------------------------------
class JobBase(BaseModel):
    job_type: str = "LEAD_SEARCH"
    stage: Optional[str] = "UNDERSTAND"
    progress: int = 0
    processed_count: int = 0
    total_count: int = 0
    error: Optional[str] = None


class JobCreate(JobBase):
    request_id: UUID


class JobUpdate(BaseModel):
    status: Optional[JobStatus] = None
    stage: Optional[str] = None
    progress: Optional[int] = None
    processed_count: Optional[int] = None
    total_count: Optional[int] = None
    error: Optional[str] = None
    completed_at: Optional[datetime] = None


class JobResponse(JobBase):
    id: UUID
    tenant_id: UUID
    request_id: UUID
    status: JobStatus
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ------------------------------------------------------------------------------
# 3. leads
# ------------------------------------------------------------------------------
class LeadBase(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company_name: Optional[str] = None
    job_title: Optional[str] = None
    industry: Optional[str] = None
    location: Optional[str] = None
    company_size: Optional[str] = None
    source: str = "AI_DISCOVERY"
    email_status: EmailStatus = EmailStatus.UNVERIFIED
    validation_status: ValidationStatus = ValidationStatus.PENDING
    enrichment_status: EnrichmentStatus = EnrichmentStatus.PENDING
    lead_status: LeadStatus = LeadStatus.NEW
    raw_data: Dict[str, Any] = Field(default_factory=dict)


class LeadCreate(LeadBase):
    request_id: Optional[UUID] = None


class LeadUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company_name: Optional[str] = None
    job_title: Optional[str] = None
    industry: Optional[str] = None
    location: Optional[str] = None
    company_size: Optional[str] = None
    email_status: Optional[EmailStatus] = None
    validation_status: Optional[ValidationStatus] = None
    enrichment_status: Optional[EnrichmentStatus] = None
    lead_status: Optional[LeadStatus] = None
    raw_data: Optional[Dict[str, Any]] = None


class LeadResponse(LeadBase):
    id: UUID
    tenant_id: UUID
    request_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ------------------------------------------------------------------------------
# 4. lead_validations & 5. lead_enrichments & 6. lead_mappings
# ------------------------------------------------------------------------------
class LeadValidationResponse(BaseModel):
    id: UUID
    lead_id: UUID
    validation_type: str
    status: str
    provider: str
    result: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


class LeadEnrichmentResponse(BaseModel):
    id: UUID
    lead_id: UUID
    provider: str
    result: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


class LeadMappingResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    lead_id: UUID
    crm_name: str
    crm_record_id: str
    sync_status: str
    last_synced_at: datetime
    error: Optional[str] = None

    class Config:
        from_attributes = True


# ------------------------------------------------------------------------------
# 7. integrations
# ------------------------------------------------------------------------------
class IntegrationBase(BaseModel):
    provider: IntegrationProvider
    status: str = "INACTIVE"
    configuration: Dict[str, Any] = Field(default_factory=dict)


class IntegrationCreate(IntegrationBase):
    pass


class IntegrationResponse(IntegrationBase):
    id: UUID
    tenant_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ------------------------------------------------------------------------------
# 8. agent_executions & 9. tool_calls & 10. audit_logs
# ------------------------------------------------------------------------------
class AgentExecutionResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    request_id: Optional[UUID] = None
    job_id: Optional[UUID] = None
    node_name: str
    status: str
    input: Dict[str, Any]
    output: Dict[str, Any]
    error: Optional[str] = None
    duration_ms: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ToolCallResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    job_id: Optional[UUID] = None
    tool_name: str
    status: str
    input: Dict[str, Any]
    output: Dict[str, Any]
    error: Optional[str] = None
    duration_ms: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AuditLogResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    user_id: Optional[UUID] = None
    action: str
    resource_type: str
    resource_id: Optional[UUID] = None
    metadata: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True
