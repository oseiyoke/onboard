# Flow Builder Migration Guide

This guide explains how to migrate from the old flow builder to the new stage-based system.

## What Changed

### Before (Old System)
- Flows contained separate nodes for each type: `content`, `assessment`, `info`
- Each node represented a single learning activity
- Flow data stored as JSON in `flow_data` column
- Linear progression through individual nodes

### After (New System)
- Flows contain **stages** that can have multiple items
- Each stage can contain content, assessments, and info items
- Stage data stored in normalized database tables
- More flexible learning paths with grouped activities

## Database Changes

The migration adds these new tables:
- `onboard_stages` - Learning stages within flows
- `onboard_stage_items` - Individual content/assessment/info items within stages
- `onboard_stage_progress` - Tracks learner progress through stages
- `onboard_stage_item_progress` - Tracks completion of individual items

## Migration Process

### 1. Run Database Migration
```bash
# Apply the database schema changes
supabase db reset
# or manually apply migration 008_stages_system.sql
```

### 2. Migrate Existing Flows
```bash
# Convert existing flows to the new format
npm run migrate:flows
```

This script will:
- Find all flows with `flow_data` (old format)
- Convert each old node into a stage with a single item
- Clear the `flow_data` to mark as migrated
- Add migration note to flow description

### 3. Manual Cleanup (Optional)
After migration, you may want to:
- Combine related stages into multi-item stages
- Assign actual content/assessments to placeholder items
- Update stage titles and descriptions
- Set stage images

## New Features

### For Authors
- **Multi-item Stages**: Combine content, quizzes, and info in one stage
- **Better Organization**: Group related learning materials together
- **Visual Indicators**: See what types of content are in each stage
- **Image Support**: Add images to stages for visual appeal

### For Learners
- **Tabbed Interface**: Navigate between items within a stage
- **Progress Tracking**: See completion status for each item
- **Stage Overview**: Understand what's coming in each stage
- **Better Flow**: More natural learning progression

## Rollback Plan

If you need to rollback:
1. Keep the old `flow_data` in a backup table before migration
2. Restore from backup if needed
3. The old flow builder code is preserved in git history

## Troubleshooting

### Migration Script Errors
- Check database connection (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- Ensure migration 008 is applied first
- Check for existing stages that might conflict

### Missing Content/Assessments
- Items without content_id or assessment_id will show placeholders
- Manually assign content through the new builder interface
- Check the migration log for items that need attention

### Old Flow Data
- Old flows will have `[Migrated from legacy flow format]` in description
- Original `flow_data` is cleared after successful migration
- Edges/connections are converted to sequential stage order

## Support

If you encounter issues:
1. Check the migration script output for specific errors
2. Verify database schema is up to date
3. Review the flow builder interface for any UI issues
4. Test with a sample flow first
