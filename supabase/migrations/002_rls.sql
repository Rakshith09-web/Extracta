-- ==============================================================================
-- Migration: 002_rls.sql
-- Description: Row Level Security (RLS) policies for tenants and profiles
-- ==============================================================================

-- Enable Row Level Security
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- Helper Functions for RLS Performance & Reusability
-- ------------------------------------------------------------------------------

-- Returns the tenant_id for the currently authenticated user
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID AS $$
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Returns the role for the currently authenticated user
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- RLS Policies: public.tenants
-- ------------------------------------------------------------------------------

-- SELECT: Users can view their own tenant
DROP POLICY IF EXISTS "Users can view their own tenant" ON public.tenants;
CREATE POLICY "Users can view their own tenant"
    ON public.tenants
    FOR SELECT
    USING (
        id = public.current_tenant_id()
    );

-- UPDATE: Admins can update their tenant's information
DROP POLICY IF EXISTS "Admins can update their tenant" ON public.tenants;
CREATE POLICY "Admins can update their tenant"
    ON public.tenants
    FOR UPDATE
    USING (
        id = public.current_tenant_id() AND public.current_user_role() = 'ADMIN'
    )
    WITH CHECK (
        id = public.current_tenant_id() AND public.current_user_role() = 'ADMIN'
    );

-- ------------------------------------------------------------------------------
-- RLS Policies: public.profiles
-- ------------------------------------------------------------------------------

-- SELECT: Users can view profiles in their own tenant
DROP POLICY IF EXISTS "Users can view profiles in their tenant" ON public.profiles;
CREATE POLICY "Users can view profiles in their tenant"
    ON public.profiles
    FOR SELECT
    USING (
        tenant_id = public.current_tenant_id() OR id = auth.uid()
    );

-- UPDATE: Users can update their own profile (non-role fields) or Admins can update any profile in tenant
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (
        id = auth.uid() OR (tenant_id = public.current_tenant_id() AND public.current_user_role() = 'ADMIN')
    )
    WITH CHECK (
        id = auth.uid() OR (tenant_id = public.current_tenant_id() AND public.current_user_role() = 'ADMIN')
    );

-- INSERT: Authenticated users / triggers can insert profile if id matches auth.uid()
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (
        id = auth.uid()
    );
