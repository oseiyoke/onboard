-- Fix RLS for onboard_assessments to allow INSERT by org admins
-- Use get_user_org_id() function instead of JWT to be consistent with other policies

DROP POLICY IF EXISTS "Admins can manage assessments in their org" ON onboard_assessments;

CREATE POLICY "Admins can manage assessments in their org"
  ON onboard_assessments
  FOR ALL
  USING (
    org_id = get_user_org_id()
    AND is_user_admin()
  )
  WITH CHECK (
    org_id = get_user_org_id()
    AND is_user_admin()
  );