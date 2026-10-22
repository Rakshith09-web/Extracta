-- ==============================================================================
-- Migration: 003_rbac_enhancements.sql
-- Description: Security trigger on profiles to prevent unauthorized role escalation
-- ==============================================================================

-- Function to protect sensitive profile fields (role and tenant_id)
CREATE OR REPLACE FUNCTION public.protect_profile_role_and_tenant()
RETURNS TRIGGER AS $$
DECLARE
    caller_role TEXT;
BEGIN
    -- If tenant_id is being changed, disallow
    IF NEW.tenant_id <> OLD.tenant_id THEN
        RAISE EXCEPTION 'Changing tenant_id is not permitted.';
    END IF;

    -- If role or status is being changed, verify caller is ADMIN or service_role
    IF (NEW.role <> OLD.role OR NEW.status <> OLD.status) THEN
        -- Check if current user is admin in this tenant
        SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
        
        -- If caller is not ADMIN and not service_role (auth.uid() is null for service_role), raise error
        IF auth.uid() IS NOT NULL AND (caller_role IS NULL OR caller_role <> 'ADMIN') THEN
            RAISE EXCEPTION 'Only organization Admins can update user roles or account status.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute before updating profiles
DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_profile_role_and_tenant();
