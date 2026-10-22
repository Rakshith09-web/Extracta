-- ==============================================================================
-- Seed: seed.sql
-- Description: Development seed fixtures for tenants and sample data
-- ==============================================================================

-- Insert a default demo tenant if it doesn't already exist
INSERT INTO public.tenants (id, name, status)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Acme Sales Corp', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;
