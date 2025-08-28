-- Add promote_to_member field to onboard_flows table
ALTER TABLE onboard_flows ADD COLUMN promote_to_member BOOLEAN NOT NULL DEFAULT false;

-- Create index for better performance on flows with promotion enabled
CREATE INDEX idx_onboard_flows_promote_to_member ON onboard_flows(promote_to_member) WHERE promote_to_member = true;
