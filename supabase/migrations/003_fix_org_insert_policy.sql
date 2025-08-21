-- Add INSERT policy for organizations
-- This allows authenticated users who don't have an organization yet to create one

-- First, create a helper function to check if user already has an organization
CREATE OR REPLACE FUNCTION user_has_organization()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM onboard_users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add INSERT policy for organizations
-- Only users who don't already have an organization can create one
CREATE POLICY "Authenticated users can create their first organization" ON onboard_organizations
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND NOT user_has_organization()
  );

-- Also need to add an INSERT policy for users to create their own profile
CREATE POLICY "Users can create their own profile" ON onboard_users
  FOR INSERT 
  WITH CHECK (
    id = auth.uid()
  );

