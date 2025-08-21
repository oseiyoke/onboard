-- Enable Row Level Security on all tables
ALTER TABLE onboard_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboard_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboard_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboard_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboard_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboard_participant_progress ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's org_id
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT org_id 
    FROM onboard_users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM onboard_users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations policies
CREATE POLICY "Users can view their own organization" ON onboard_organizations
  FOR SELECT USING (id = get_user_org_id());

CREATE POLICY "Admins can update their organization" ON onboard_organizations
  FOR UPDATE USING (id = get_user_org_id() AND is_user_admin());

-- Users policies
CREATE POLICY "Users can view users in their organization" ON onboard_users
  FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "Users can update their own profile" ON onboard_users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can insert users in their organization" ON onboard_users
  FOR INSERT WITH CHECK (org_id = get_user_org_id() AND is_user_admin());

CREATE POLICY "Admins can update users in their organization" ON onboard_users
  FOR UPDATE USING (org_id = get_user_org_id() AND is_user_admin());

-- Flows policies
CREATE POLICY "Users can view flows in their organization" ON onboard_flows
  FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "Admins can manage flows in their organization" ON onboard_flows
  FOR ALL USING (org_id = get_user_org_id() AND is_user_admin());

-- Content policies
CREATE POLICY "Users can view content in their organization" ON onboard_content
  FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "Admins can manage content in their organization" ON onboard_content
  FOR ALL USING (org_id = get_user_org_id() AND is_user_admin());

-- Assessments policies
CREATE POLICY "Users can view assessments in their organization" ON onboard_assessments
  FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "Admins can manage assessments in their organization" ON onboard_assessments
  FOR ALL USING (org_id = get_user_org_id() AND is_user_admin());

-- Participant progress policies
CREATE POLICY "Users can view progress in their organization" ON onboard_participant_progress
  FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "Participants can view and update their own progress" ON onboard_participant_progress
  FOR ALL USING (participant_id = auth.uid());

CREATE POLICY "Admins can manage all progress in their organization" ON onboard_participant_progress
  FOR ALL USING (org_id = get_user_org_id() AND is_user_admin());

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- This will be called when a new user signs up
  -- The actual user creation will be handled by the application
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup (placeholder - actual implementation in app)
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION handle_new_user();
