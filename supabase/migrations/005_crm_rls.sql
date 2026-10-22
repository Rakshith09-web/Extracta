-- ==============================================================================
-- Migration: 005_crm_rls.sql
-- Description: Row Level Security (RLS) policies for all CRM and AI execution tables
-- ==============================================================================

-- Enable RLS on all 10 CRM tables
ALTER TABLE public.sales_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_enrichments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 1. sales_requests policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view tenant sales requests" ON public.sales_requests;
CREATE POLICY "Users can view tenant sales requests"
    ON public.sales_requests FOR SELECT
    USING (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS "Users can create tenant sales requests" ON public.sales_requests;
CREATE POLICY "Users can create tenant sales requests"
    ON public.sales_requests FOR INSERT
    WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS "Users can update tenant sales requests" ON public.sales_requests;
CREATE POLICY "Users can update tenant sales requests"
    ON public.sales_requests FOR UPDATE
    USING (tenant_id = public.current_tenant_id());

-- ------------------------------------------------------------------------------
-- 2. jobs policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view tenant jobs" ON public.jobs;
CREATE POLICY "Users can view tenant jobs"
    ON public.jobs FOR SELECT
    USING (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS "Users can insert tenant jobs" ON public.jobs;
CREATE POLICY "Users can insert tenant jobs"
    ON public.jobs FOR INSERT
    WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS "Users can update tenant jobs" ON public.jobs;
CREATE POLICY "Users can update tenant jobs"
    ON public.jobs FOR UPDATE
    USING (tenant_id = public.current_tenant_id());

-- ------------------------------------------------------------------------------
-- 3. leads policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view tenant leads" ON public.leads;
CREATE POLICY "Users can view tenant leads"
    ON public.leads FOR SELECT
    USING (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS "Users can insert tenant leads" ON public.leads;
CREATE POLICY "Users can insert tenant leads"
    ON public.leads FOR INSERT
    WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS "Users can update tenant leads" ON public.leads;
CREATE POLICY "Users can update tenant leads"
    ON public.leads FOR UPDATE
    USING (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS "Users can delete tenant leads" ON public.leads;
CREATE POLICY "Users can delete tenant leads"
    ON public.leads FOR DELETE
    USING (tenant_id = public.current_tenant_id() AND public.current_user_role() IN ('ADMIN', 'SALES_MANAGER'));

-- ------------------------------------------------------------------------------
-- 4. lead_validations policies (Inherited tenant boundary via leads)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view tenant lead validations" ON public.lead_validations;
CREATE POLICY "Users can view tenant lead validations"
    ON public.lead_validations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.leads 
            WHERE leads.id = lead_validations.lead_id 
            AND leads.tenant_id = public.current_tenant_id()
        )
    );

DROP POLICY IF EXISTS "Users can insert tenant lead validations" ON public.lead_validations;
CREATE POLICY "Users can insert tenant lead validations"
    ON public.lead_validations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.leads 
            WHERE leads.id = lead_validations.lead_id 
            AND leads.tenant_id = public.current_tenant_id()
        )
    );

-- ------------------------------------------------------------------------------
-- 5. lead_enrichments policies (Inherited tenant boundary via leads)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view tenant lead enrichments" ON public.lead_enrichments;
CREATE POLICY "Users can view tenant lead enrichments"
    ON public.lead_enrichments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.leads 
            WHERE leads.id = lead_enrichments.lead_id 
            AND leads.tenant_id = public.current_tenant_id()
        )
    );

DROP POLICY IF EXISTS "Users can insert tenant lead enrichments" ON public.lead_enrichments;
CREATE POLICY "Users can insert tenant lead enrichments"
    ON public.lead_enrichments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.leads 
            WHERE leads.id = lead_enrichments.lead_id 
            AND leads.tenant_id = public.current_tenant_id()
        )
    );

-- ------------------------------------------------------------------------------
-- 6. lead_mappings policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view tenant lead mappings" ON public.lead_mappings;
CREATE POLICY "Users can view tenant lead mappings"
    ON public.lead_mappings FOR SELECT
    USING (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS "Users can manage tenant lead mappings" ON public.lead_mappings;
CREATE POLICY "Users can manage tenant lead mappings"
    ON public.lead_mappings FOR ALL
    USING (tenant_id = public.current_tenant_id());

-- ------------------------------------------------------------------------------
-- 7. integrations policies (Admins manage, managers view)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view tenant integrations" ON public.integrations;
CREATE POLICY "Users can view tenant integrations"
    ON public.integrations FOR SELECT
    USING (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS "Admins can manage tenant integrations" ON public.integrations;
CREATE POLICY "Admins can manage tenant integrations"
    ON public.integrations FOR ALL
    USING (tenant_id = public.current_tenant_id() AND public.current_user_role() = 'ADMIN');

-- ------------------------------------------------------------------------------
-- 8. agent_executions policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view tenant agent executions" ON public.agent_executions;
CREATE POLICY "Users can view tenant agent executions"
    ON public.agent_executions FOR SELECT
    USING (tenant_id = public.current_tenant_id());

-- ------------------------------------------------------------------------------
-- 9. tool_calls policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view tenant tool calls" ON public.tool_calls;
CREATE POLICY "Users can view tenant tool calls"
    ON public.tool_calls FOR SELECT
    USING (tenant_id = public.current_tenant_id());

-- ------------------------------------------------------------------------------
-- 10. audit_logs policies (Admins & Managers view only)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Managers and Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Managers and Admins can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (
        tenant_id = public.current_tenant_id() 
        AND public.current_user_role() IN ('ADMIN', 'SALES_MANAGER')
    );
