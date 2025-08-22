-- Create assessment and question tables
-- This implements the flexible assessment system that can use existing content for AI generation

DROP TABLE IF EXISTS onboard_assessments;
-- Create enrollments table referenced by assessment attempts
CREATE TABLE IF NOT EXISTS onboard_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES onboard_users(id) ON DELETE CASCADE,
    flow_id UUID NOT NULL REFERENCES onboard_flows(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_onboard_enrollments_user_flow ON onboard_enrollments(user_id, flow_id);

CREATE TABLE onboard_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES onboard_organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    passing_score NUMERIC(5,2) DEFAULT 70.0 CHECK (passing_score >= 0 AND passing_score <= 100),
    retry_limit INTEGER DEFAULT 3 CHECK (retry_limit >= 0),
    time_limit_seconds INTEGER CHECK (time_limit_seconds > 0),
    randomize_questions BOOLEAN DEFAULT FALSE,
    randomize_answers BOOLEAN DEFAULT TRUE,
    show_feedback BOOLEAN DEFAULT TRUE,
    show_correct_answers BOOLEAN DEFAULT TRUE,
    -- Source information for AI-generated assessments
    generation_source JSONB DEFAULT NULL, -- {type: 'manual'|'prompt'|'content', content_id?: string, prompt?: string}
    settings JSONB DEFAULT '{}',
    is_published BOOLEAN DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES onboard_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE onboard_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES onboard_assessments(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'multi_select', 'true_false', 'short_answer', 'essay', 'file_upload')),
    question TEXT NOT NULL,
    options JSONB DEFAULT '[]', -- For multiple choice: ["Option A", "Option B", ...]
    correct_answer JSONB NOT NULL, -- Format depends on type: string, array, boolean, etc.
    explanation TEXT,
    points NUMERIC(5,2) DEFAULT 1.0 CHECK (points >= 0),
    position INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}', -- Additional settings per question
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create assessment attempts table for tracking participant progress
CREATE TABLE onboard_assessment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES onboard_assessments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES onboard_users(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES onboard_enrollments(id) ON DELETE CASCADE, -- If part of a flow
    score NUMERIC(5,2) CHECK (score >= 0 AND score <= 100),
    max_score NUMERIC(5,2) CHECK (max_score >= 0),
    time_spent_seconds INTEGER DEFAULT 0,
    answers JSONB DEFAULT '{}', -- {questionId: answer}
    is_passed BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE onboard_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboard_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboard_assessment_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assessments
CREATE POLICY "Users can view assessments in their org" ON onboard_assessments
    FOR SELECT USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "Admins can manage assessments in their org" ON onboard_assessments
    FOR ALL USING (
        org_id = (auth.jwt() ->> 'org_id')::uuid 
        AND EXISTS (
            SELECT 1 FROM onboard_users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- RLS Policies for questions
CREATE POLICY "Users can view questions for accessible assessments" ON onboard_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM onboard_assessments a
            WHERE a.id = assessment_id 
            AND a.org_id = (auth.jwt() ->> 'org_id')::uuid
        )
    );

CREATE POLICY "Admins can manage questions for their assessments" ON onboard_questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM onboard_assessments a
            JOIN onboard_users u ON u.id = auth.uid()
            WHERE a.id = assessment_id 
            AND a.org_id = (auth.jwt() ->> 'org_id')::uuid
            AND u.role = 'admin'
        )
    );

-- RLS Policies for attempts
CREATE POLICY "Users can view their own attempts" ON onboard_assessment_attempts
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view attempts in their org" ON onboard_assessment_attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM onboard_assessments a
            JOIN onboard_users u ON u.id = auth.uid()
            WHERE a.id = assessment_id 
            AND a.org_id = (auth.jwt() ->> 'org_id')::uuid
            AND u.role = 'admin'
        )
    );

CREATE POLICY "Users can create their own attempts" ON onboard_assessment_attempts
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own attempts" ON onboard_assessment_attempts
    FOR UPDATE USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_onboard_assessments_org_id ON onboard_assessments(org_id);
CREATE INDEX idx_onboard_assessments_published ON onboard_assessments(org_id, is_published);
CREATE INDEX idx_onboard_questions_assessment_position ON onboard_questions(assessment_id, position);
CREATE INDEX idx_onboard_assessment_attempts_user_assessment ON onboard_assessment_attempts(user_id, assessment_id);
CREATE INDEX idx_onboard_assessment_attempts_enrollment ON onboard_assessment_attempts(enrollment_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_onboard_assessments_updated_at 
    BEFORE UPDATE ON onboard_assessments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
