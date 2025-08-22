-- Add support for multiple content sources (upload, youtube, gdrive, external)
-- and additional metadata fields

ALTER TABLE onboard_content
  ADD COLUMN source TEXT NOT NULL DEFAULT 'upload' CHECK (source IN ('upload', 'youtube', 'gdrive', 'external')),
  ADD COLUMN external_url TEXT,
  ADD COLUMN thumbnail_url TEXT,
  ADD COLUMN version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN duration INTEGER, -- Duration in seconds for videos
  ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0;



-- Add index for better query performance
CREATE INDEX idx_onboard_content_source ON onboard_content(source);
CREATE INDEX idx_onboard_content_org_source ON onboard_content(org_id, source);

-- Update existing records to have source = 'upload'
UPDATE onboard_content SET source = 'upload' WHERE source IS NULL;

-- Add constraint to ensure external_url is provided for non-upload sources
ALTER TABLE onboard_content
  ADD CONSTRAINT check_external_url_for_external_sources
  CHECK (
    (source = 'upload' AND external_url IS NULL) OR
    (source IN ('youtube', 'gdrive', 'external') AND external_url IS NOT NULL)
  );

-- Add constraint to ensure file_url is provided for upload sources
ALTER TABLE onboard_content
  ADD CONSTRAINT check_file_url_for_upload_sources
  CHECK (
    (source = 'upload' AND file_url IS NOT NULL) OR
    (source IN ('youtube', 'gdrive', 'external'))
  );

ALTER TABLE onboard_content 
  ALTER COLUMN file_url DROP NOT NULL;

-- Also make file_size nullable since external content might not have a file size
ALTER TABLE onboard_content 
  ALTER COLUMN file_size DROP NOT NULL;
