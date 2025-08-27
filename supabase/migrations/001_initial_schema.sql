-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'participant');
CREATE TYPE content_type AS ENUM ('pdf', 'video', 'document', 'image', 'other');

-- Organizations table
CREATE TABLE onboard_organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE onboard_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES onboard_organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'participant',
  first_name TEXT,
  last_name TEXT,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flows table
CREATE TABLE onboard_flows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES onboard_organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  flow_data JSONB NOT NULL DEFAULT '{"nodes": [], "edges": []}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES onboard_users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content table
CREATE TABLE onboard_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES onboard_organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type content_type NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES onboard_users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessments table
CREATE TABLE onboard_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES onboard_organizations(id) ON DELETE CASCADE,
  flow_id UUID NOT NULL REFERENCES onboard_flows(id) ON DELETE CASCADE,
  phase_id TEXT NOT NULL, -- References a phase within the flow
  questions JSONB NOT NULL DEFAULT '[]',
  created_by UUID NOT NULL REFERENCES onboard_users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Participant progress table
CREATE TABLE onboard_participant_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES onboard_organizations(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES onboard_users(id) ON DELETE CASCADE,
  flow_id UUID NOT NULL REFERENCES onboard_flows(id) ON DELETE CASCADE,
  current_phase TEXT,
  completed_phases TEXT[] DEFAULT '{}',
  assessment_scores JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(participant_id, flow_id)
);

-- Indexes for better performance
CREATE INDEX idx_onboard_users_org_id ON onboard_users(org_id);
CREATE INDEX idx_onboard_users_email ON onboard_users(email);
CREATE INDEX idx_onboard_flows_org_id ON onboard_flows(org_id);
CREATE INDEX idx_onboard_flows_active ON onboard_flows(org_id, is_active);
CREATE INDEX idx_onboard_content_org_id ON onboard_content(org_id);
CREATE INDEX idx_onboard_assessments_org_id ON onboard_assessments(org_id);
CREATE INDEX idx_onboard_assessments_flow_id ON onboard_assessments(flow_id);
CREATE INDEX idx_onboard_participant_progress_org_id ON onboard_participant_progress(org_id);
CREATE INDEX idx_onboard_participant_progress_participant ON onboard_participant_progress(participant_id);
CREATE INDEX idx_onboard_participant_progress_flow ON onboard_participant_progress(flow_id);

-- Update timestamps function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_onboard_organizations_updated_at 
  BEFORE UPDATE ON onboard_organizations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboard_users_updated_at 
  BEFORE UPDATE ON onboard_users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboard_flows_updated_at 
  BEFORE UPDATE ON onboard_flows 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboard_content_updated_at 
  BEFORE UPDATE ON onboard_content 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboard_assessments_updated_at 
  BEFORE UPDATE ON onboard_assessments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboard_participant_progress_updated_at 
  BEFORE UPDATE ON onboard_participant_progress 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
