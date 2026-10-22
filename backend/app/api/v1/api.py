from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    auth,
    users,
    tenants,
    profiles,
    searches,
    leads,
    integrations,
    audit_logs,
    webhooks,
    outreach,
)

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Team User Management"])
api_router.include_router(tenants.router, prefix="/tenants", tags=["Tenant Administration"])
api_router.include_router(profiles.router, prefix="/profiles", tags=["User Profiles"])
api_router.include_router(searches.router, prefix="/searches", tags=["AI Searches"])
api_router.include_router(leads.router, prefix="/leads", tags=["Leads Management"])
api_router.include_router(outreach.router, prefix="/outreach", tags=["Bulk Email Outreach"])
api_router.include_router(integrations.router, prefix="/integrations", tags=["Integrations"])
api_router.include_router(audit_logs.router, prefix="/audit-logs", tags=["Audit Logs"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["n8n Automation Webhooks"])
