-- Create stages and stage items system
-- This implements the new multi-item stages approach replacing the old flow_data nodes

-- Create stages table
CREATE TABLE onboard_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id UUID NOT NULL REFERENCES onboard_flows(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    position INTEGER NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create stage items table  
CREATE TABLE onboard_stage_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id UUID NOT NULL REFERENCES onboard_stages(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('content', 'assessment', 'info')),
    title TEXT NOT NULL,
    position INTEGER NOT NULL,
    -- References to existing content/assessments
    content_id UUID REFERENCES onboard_content(id) ON DELETE SET NULL,
    assessment_id UUID REFERENCES onboard_assessments(id) ON DELETE SET NULL,
    -- For inline content (info blocks)
    body TEXT,
    settings JSONB DEFAULT '{}', -- Item-specific settings like passing_score override
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create stage progress tracking
CREATE TABLE onboard_stage_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES onboard_users(id) ON DELETE CASCADE,
    enrollment_id UUID NOT NULL REFERENCES onboard_enrollments(id) ON DELETE CASCADE,
    stage_id UUID NOT NULL REFERENCES onboard_stages(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, stage_id, enrollment_id)
);

-- Create stage item progress tracking  
CREATE TABLE onboard_stage_item_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES onboard_users(id) ON DELETE CASCADE,
    enrollment_id UUID NOT NULL REFERENCES onboard_enrollments(id) ON DELETE CASCADE,
    stage_item_id UUID NOT NULL REFERENCES onboard_stage_items(id) ON DELETE CASCADE,
    score NUMERIC(5,2) CHECK (score >= 0 AND score <= 100),
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}', -- Additional progress data
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, stage_item_id, enrollment_id)
);

-- Enable Row Level Security
ALTER TABLE onboard_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboard_stage_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboard_stage_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboard_stage_item_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stages
CREATE POLICY "Users can view stages for flows in their org" ON onboard_stages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM onboard_flows f
            WHERE f.id = flow_id 
            AND f.org_id = (auth.jwt() ->> 'org_id')::uuid
        )
    );

CREATE POLICY "Admins can manage stages for flows in their org" ON onboard_stages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM onboard_flows f
            JOIN onboard_users u ON u.id = auth.uid()
            WHERE f.id = flow_id 
            AND f.org_id = (auth.jwt() ->> 'org_id')::uuid
            AND u.role = 'admin'
        )
    );

-- RLS Policies for stage items
CREATE POLICY "Users can view stage items for accessible stages" ON onboard_stage_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM onboard_stages s
            JOIN onboard_flows f ON f.id = s.flow_id
            WHERE s.id = stage_id 
            AND f.org_id = (auth.jwt() ->> 'org_id')::uuid
        )
    );

CREATE POLICY "Admins can manage stage items for their stages" ON onboard_stage_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM onboard_stages s
            JOIN onboard_flows f ON f.id = s.flow_id
            JOIN onboard_users u ON u.id = auth.uid()
            WHERE s.id = stage_id 
            AND f.org_id = (auth.jwt() ->> 'org_id')::uuid
            AND u.role = 'admin'
        )
    );

-- RLS Policies for stage progress
CREATE POLICY "Users can view their own stage progress" ON onboard_stage_progress
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view stage progress in their org" ON onboard_stage_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM onboard_stages s
            JOIN onboard_flows f ON f.id = s.flow_id
            JOIN onboard_users u ON u.id = auth.uid()
            WHERE s.id = stage_id 
            AND f.org_id = (auth.jwt() ->> 'org_id')::uuid
            AND u.role = 'admin'
        )
    );

CREATE POLICY "Users can create their own stage progress" ON onboard_stage_progress
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own stage progress" ON onboard_stage_progress
    FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for stage item progress
CREATE POLICY "Users can view their own stage item progress" ON onboard_stage_item_progress
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view stage item progress in their org" ON onboard_stage_item_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM onboard_stage_items si
            JOIN onboard_stages s ON s.id = si.stage_id
            JOIN onboard_flows f ON f.id = s.flow_id
            JOIN onboard_users u ON u.id = auth.uid()
            WHERE si.id = stage_item_id 
            AND f.org_id = (auth.jwt() ->> 'org_id')::uuid
            AND u.role = 'admin'
        )
    );

CREATE POLICY "Users can create their own stage item progress" ON onboard_stage_item_progress
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own stage item progress" ON onboard_stage_item_progress
    FOR UPDATE USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_onboard_stages_flow_position ON onboard_stages(flow_id, position);
CREATE INDEX idx_onboard_stage_items_stage_position ON onboard_stage_items(stage_id, position);
CREATE INDEX idx_onboard_stage_items_content ON onboard_stage_items(content_id) WHERE content_id IS NOT NULL;
CREATE INDEX idx_onboard_stage_items_assessment ON onboard_stage_items(assessment_id) WHERE assessment_id IS NOT NULL;
CREATE INDEX idx_onboard_stage_progress_user_enrollment ON onboard_stage_progress(user_id, enrollment_id);
CREATE INDEX idx_onboard_stage_item_progress_user_enrollment ON onboard_stage_item_progress(user_id, enrollment_id);

-- Add triggers to update updated_at timestamp
CREATE TRIGGER update_onboard_stages_updated_at 
    BEFORE UPDATE ON onboard_stages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add constraint to ensure proper item type references
ALTER TABLE onboard_stage_items ADD CONSTRAINT check_item_type_reference
CHECK (
    (type = 'content' AND content_id IS NOT NULL AND assessment_id IS NULL AND body IS NULL) OR
    (type = 'assessment' AND assessment_id IS NOT NULL AND content_id IS NULL AND body IS NULL) OR  
    (type = 'info' AND body IS NOT NULL AND content_id IS NULL AND assessment_id IS NULL)
);

-- Function to reorder stages after deletion
CREATE OR REPLACE FUNCTION reorder_stages_after_delete(p_flow_id UUID, p_deleted_position INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE onboard_stages 
    SET position = position - 1, updated_at = NOW()
    WHERE flow_id = p_flow_id 
    AND position > p_deleted_position;
END;
$$ LANGUAGE plpgsql;

-- Function to get flow progress summary (referenced in progress service)
CREATE OR REPLACE FUNCTION get_flow_progress_summary(p_flow_id UUID)
RETURNS TABLE (
    total_enrolled BIGINT,
    total_completed BIGINT, 
    completion_rate NUMERIC(5,2),
    avg_completion_time_hours NUMERIC(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT e.id)::BIGINT as total_enrolled,
        COUNT(DISTINCT CASE WHEN e.completed_at IS NOT NULL THEN e.id END)::BIGINT as total_completed,
        ROUND(
            CASE 
                WHEN COUNT(DISTINCT e.id) > 0 
                THEN (COUNT(DISTINCT CASE WHEN e.completed_at IS NOT NULL THEN e.id END)::NUMERIC / COUNT(DISTINCT e.id)::NUMERIC) * 100 
                ELSE 0 
            END, 2
        ) as completion_rate,
        ROUND(
            AVG(
                CASE 
                    WHEN e.completed_at IS NOT NULL 
                    THEN EXTRACT(EPOCH FROM (e.completed_at - e.started_at)) / 3600.0
                    ELSE NULL 
                END
            )::NUMERIC, 2
        ) as avg_completion_time_hours
    FROM onboard_enrollments e
    WHERE e.flow_id = p_flow_id;
END;
$$ LANGUAGE plpgsql;
