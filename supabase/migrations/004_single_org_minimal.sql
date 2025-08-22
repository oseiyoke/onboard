-- Migration: single organisation default & automatic user row
-- -----------------------------------------------------------
-- 1. Sentinel organisation row (id is fixed for easy FK defaults)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM onboard_organizations WHERE id = '00000000-0000-0000-0000-000000000000'
  ) THEN
    INSERT INTO onboard_organizations (id, name, slug, settings)
    VALUES ('00000000-0000-0000-0000-000000000000', 'Default organisation', 'default', '{}');
  END IF;
END $$;

-- 2. Set DEFAULTs on all org_id columns to the sentinel id
ALTER TABLE onboard_users                  ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000000';
ALTER TABLE onboard_flows                  ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000000';
ALTER TABLE onboard_content                ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000000';
ALTER TABLE onboard_assessments            ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000000';
ALTER TABLE onboard_participant_progress   ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000000';

-- 3. Ensure all existing rows now reference the sentinel organisation
UPDATE onboard_users                SET org_id = '00000000-0000-0000-0000-000000000000';
UPDATE onboard_flows                SET org_id = '00000000-0000-0000-0000-000000000000';
UPDATE onboard_content              SET org_id = '00000000-0000-0000-0000-000000000000';
UPDATE onboard_assessments          SET org_id = '00000000-0000-0000-0000-000000000000';
UPDATE onboard_participant_progress SET org_id = '00000000-0000-0000-0000-000000000000';

-- 4. Replace the placeholder new-user trigger so that every signup automatically
--    creates the participatory row pointing to the sentinel organisation.
DROP FUNCTION IF EXISTS handle_new_user CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a matching onboard_users record with default role (participant)
  INSERT INTO onboard_users (id, org_id, email)
  VALUES (NEW.id, '00000000-0000-0000-0000-000000000000', NEW.email)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger if it does not already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION handle_new_user();
  END IF;
END $$;

-- 5. (Optional safety) Prevent deletion of the sentinel organisation row
ALTER TABLE onboard_organizations
  ADD CONSTRAINT single_org_protect
  CHECK (id = '00000000-0000-0000-0000-000000000000');

-- 6. RLS: Allow a new user (anon role) to insert their own onboard_users row
ALTER TABLE onboard_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can self insert" ON onboard_users;
CREATE POLICY "Users can self insert" ON onboard_users
  FOR INSERT WITH CHECK (auth.uid() is NULL OR id = auth.uid());
