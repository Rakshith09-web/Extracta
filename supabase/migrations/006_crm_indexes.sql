-- ==============================================================================
-- Migration: 006_crm_indexes.sql
-- Description: Performance optimization indexes for multi-tenant CRM tables
-- ==============================================================================

-- sales_requests indexes
CREATE INDEX IF NOT EXISTS idx_sales_requests_tenant ON public.sales_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_requests_user ON public.sales_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_requests_status ON public.sales_requests(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_sales_requests_created ON public.sales_requests(tenant_id, created_at DESC);

-- jobs indexes
CREATE INDEX IF NOT EXISTS idx_jobs_tenant ON public.jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_jobs_request ON public.jobs(request_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_created ON public.jobs(tenant_id, created_at DESC);

-- leads indexes
CREATE INDEX IF NOT EXISTS idx_leads_tenant ON public.leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_request ON public.leads(request_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_leads_company ON public.leads(tenant_id, company_name);
CREATE INDEX IF NOT EXISTS idx_leads_industry ON public.leads(tenant_id, industry);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(tenant_id, lead_status);
CREATE INDEX IF NOT EXISTS idx_leads_val_status ON public.leads(tenant_id, validation_status);
CREATE INDEX IF NOT EXISTS idx_leads_enrich_status ON public.leads(tenant_id, enrichment_status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON public.leads(tenant_id, created_at DESC);

-- lead_validations & lead_enrichments indexes
CREATE INDEX IF NOT EXISTS idx_lead_validations_lead ON public.lead_validations(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_enrichments_lead ON public.lead_enrichments(lead_id);

-- lead_mappings indexes
CREATE INDEX IF NOT EXISTS idx_lead_mappings_tenant ON public.lead_mappings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lead_mappings_lead ON public.lead_mappings(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_mappings_crm_record ON public.lead_mappings(crm_name, crm_record_id);

-- integrations indexes
CREATE INDEX IF NOT EXISTS idx_integrations_tenant ON public.integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON public.integrations(tenant_id, provider);

-- agent_executions & tool_calls indexes
CREATE INDEX IF NOT EXISTS idx_agent_executions_job ON public.agent_executions(job_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_tenant ON public.agent_executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tool_calls_job ON public.tool_calls(job_id);
CREATE INDEX IF NOT EXISTS idx_tool_calls_tenant ON public.tool_calls(tenant_id);

-- audit_logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(tenant_id, resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(tenant_id, created_at DESC);
