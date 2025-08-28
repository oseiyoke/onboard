-- Add member field to onboard_users table
ALTER TABLE onboard_users ADD COLUMN member BOOLEAN DEFAULT false;

-- Create helper function to check if user is a member (returns true for admins or members)
CREATE OR REPLACE FUNCTION is_user_member()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'admin' OR COALESCE(member, false) = true
    FROM onboard_users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for better performance on member queries
CREATE INDEX idx_onboard_users_member ON onboard_users(member) WHERE member = true;
