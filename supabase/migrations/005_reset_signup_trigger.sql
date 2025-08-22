-- Migration 005: Reset auth.users signup trigger
-- ------------------------------------------------
-- 1. Drop the old trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user CASCADE;

-- 2. Re-create the function that inserts a matching row in public.onboard_users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the user as a participant in the sentinel organisation
  INSERT INTO public.onboard_users (id, org_id, email)
  VALUES (NEW.id, '00000000-0000-0000-0000-000000000000', NEW.email)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Verify trigger is enabled
-- (optional RAISE NOTICE removed for production)
