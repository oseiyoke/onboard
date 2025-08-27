-- Fix RLS for onboard_assessments SELECT policy to use get_user_org_id() instead of JWT
-- This resolves the conflict between the JWT-based policy from migration 007 and the function-based policy from migration 002
DROP POLICY IF EXISTS "Users can view assessments in their org" ON onboard_assessments;

CREATE POLICY "Users can view assessments in their organization" 
ON public.onboard_assessments
FOR SELECT 
USING (org_id = get_user_org_id());