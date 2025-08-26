-- Fix RLS policies for stages system 
-- Create helper functions and update policies to be consistent with assessments

-- Create helper functions for RLS policies
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS uuid AS $$
BEGIN
  RETURN (
    SELECT org_id FROM onboard_users 
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_user_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role = 'admin' FROM onboard_users 
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate RLS policies for onboard_stages
DROP POLICY IF EXISTS "Users can view stages for flows in their org" ON onboard_stages;
DROP POLICY IF EXISTS "Admins can manage stages for flows in their org" ON onboard_stages;

CREATE POLICY "Users can view stages for flows in their org" 
  ON onboard_stages
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM onboard_flows f
      WHERE f.id = flow_id 
      AND f.org_id = get_user_org_id()
    )
  );

CREATE POLICY "Admins can manage stages for flows in their org"
  ON onboard_stages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM onboard_flows f
      WHERE f.id = flow_id 
      AND f.org_id = get_user_org_id()
      AND is_user_admin()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM onboard_flows f
      WHERE f.id = flow_id 
      AND f.org_id = get_user_org_id()
      AND is_user_admin()
    )
  );

-- Drop and recreate RLS policies for onboard_stage_items  
DROP POLICY IF EXISTS "Users can view stage items for accessible stages" ON onboard_stage_items;
DROP POLICY IF EXISTS "Admins can manage stage items for their stages" ON onboard_stage_items;

CREATE POLICY "Users can view stage items for accessible stages" 
  ON onboard_stage_items
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM onboard_stages s
      JOIN onboard_flows f ON f.id = s.flow_id
      WHERE s.id = stage_id 
      AND f.org_id = get_user_org_id()
    )
  );

CREATE POLICY "Admins can manage stage items for their stages"
  ON onboard_stage_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM onboard_stages s
      JOIN onboard_flows f ON f.id = s.flow_id
      WHERE s.id = stage_id 
      AND f.org_id = get_user_org_id()
      AND is_user_admin()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM onboard_stages s
      JOIN onboard_flows f ON f.id = s.flow_id
      WHERE s.id = stage_id 
      AND f.org_id = get_user_org_id()
      AND is_user_admin()
    )
  );

-- Update stage progress policies to use helper functions for consistency
DROP POLICY IF EXISTS "Admins can view stage progress in their org" ON onboard_stage_progress;

CREATE POLICY "Admins can view stage progress in their org" 
  ON onboard_stage_progress
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM onboard_stages s
      JOIN onboard_flows f ON f.id = s.flow_id
      WHERE s.id = stage_id 
      AND f.org_id = get_user_org_id()
      AND is_user_admin()
    )
  );

-- Update stage item progress policies to use helper functions for consistency  
DROP POLICY IF EXISTS "Admins can view stage item progress in their org" ON onboard_stage_item_progress;

CREATE POLICY "Admins can view stage item progress in their org" 
  ON onboard_stage_item_progress
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM onboard_stage_items si
      JOIN onboard_stages s ON s.id = si.stage_id
      JOIN onboard_flows f ON f.id = s.flow_id
      WHERE si.id = stage_item_id 
      AND f.org_id = get_user_org_id()
      AND is_user_admin()
    )
  );
