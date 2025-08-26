-- Fix RLS for assessment-related tables to use helper functions
-- This ensures consistency across all RLS policies

-- 1. Fix policies for onboard_questions
DROP POLICY IF EXISTS "Users can view questions for accessible assessments" ON onboard_questions;
DROP POLICY IF EXISTS "Admins can manage questions for their assessments" ON onboard_questions;

CREATE POLICY "Users can view questions for accessible assessments" 
  ON onboard_questions
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM onboard_assessments a
      WHERE a.id = assessment_id 
      AND a.org_id = get_user_org_id()
    )
  );

CREATE POLICY "Admins can manage questions for their assessments"
  ON onboard_questions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM onboard_assessments a
      WHERE a.id = assessment_id 
      AND a.org_id = get_user_org_id()
      AND is_user_admin()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM onboard_assessments a
      WHERE a.id = assessment_id 
      AND a.org_id = get_user_org_id()
      AND is_user_admin()
    )
  );

-- 2. Fix policies for onboard_assessment_attempts
DROP POLICY IF EXISTS "Admins can view attempts in their org" ON onboard_assessment_attempts;

CREATE POLICY "Admins can view attempts in their org" 
  ON onboard_assessment_attempts
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM onboard_assessments a
      WHERE a.id = assessment_id 
      AND a.org_id = get_user_org_id()
      AND is_user_admin()
    )
  );

-- Note: The other attempt policies (users managing their own) don't need changes 
-- as they correctly use auth.uid()
