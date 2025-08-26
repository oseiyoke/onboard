#!/usr/bin/env node

/**
 * Migration script to convert existing flows from the old flow_data format 
 * to the new stages and stage_items tables.
 * 
 * Usage: node scripts/migrate-flows-to-stages.js
 */

const { createClient } = require('@supabase/supabase-js')
const { config } = require('dotenv')

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function migrateFlowsToStages() {
  console.log('Starting migration of flows to stages...')
  
  try {
    // Get all flows with flow_data
    const { data: flows, error: flowsError } = await supabase
      .from('onboard_flows')
      .select('*')
      .not('flow_data', 'is', null)
    
    if (flowsError) {
      throw flowsError
    }
    
    console.log(`Found ${flows.length} flows to migrate`)
    
    let migratedCount = 0
    let skippedCount = 0
    let errorCount = 0
    
    for (const flow of flows) {
      try {
        console.log(`\nMigrating flow: ${flow.name} (${flow.id})`)
        
        const flowData = flow.flow_data
        if (!flowData || !flowData.nodes) {
          console.log('  - Skipping: No nodes in flow_data')
          skippedCount++
          continue
        }
        
        // Check if this flow has already been migrated (has stages)
        const { data: existingStages } = await supabase
          .from('onboard_stages')
          .select('id')
          .eq('flow_id', flow.id)
          .limit(1)
        
        if (existingStages && existingStages.length > 0) {
          console.log('  - Skipping: Flow already has stages')
          skippedCount++
          continue
        }
        
        // Convert nodes to stages
        const nodes = flowData.nodes.filter(node => 
          node.type && ['content', 'assessment', 'info'].includes(node.type)
        )
        
        if (nodes.length === 0) {
          console.log('  - Skipping: No valid phase nodes found')
          skippedCount++
          continue
        }
        
        console.log(`  - Converting ${nodes.length} nodes to stages`)
        
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i]
          
          // Create stage
          const stageTitle = node.data?.label || `${node.type.charAt(0).toUpperCase() + node.type.slice(1)} Stage`
          const stageDescription = node.data?.description || null
          
          const { data: stage, error: stageError } = await supabase
            .from('onboard_stages')
            .insert({
              flow_id: flow.id,
              title: stageTitle,
              description: stageDescription,
              position: i,
            })
            .select()
            .single()
          
          if (stageError) {
            throw stageError
          }
          
          console.log(`    - Created stage: ${stage.title}`)
          
          // Create stage item based on node type
          let itemData = {
            stage_id: stage.id,
            type: node.type,
            title: stageTitle,
            position: 0,
          }
          
          // Add type-specific data
          if (node.type === 'content') {
            // For content nodes, we'll need to create a placeholder
            // since the old format didn't have structured content
            itemData.content_id = null // Will need manual assignment later
          } else if (node.type === 'assessment') {
            // Try to find assessment ID from node data
            if (node.data?.assessmentId) {
              itemData.assessment_id = node.data.assessmentId
            } else {
              itemData.assessment_id = null // Will need manual assignment later
            }
          } else if (node.type === 'info') {
            // Use content from node data
            itemData.body = node.data?.content || 'Information content'
          }
          
          const { error: itemError } = await supabase
            .from('onboard_stage_items')
            .insert(itemData)
          
          if (itemError) {
            throw itemError
          }
          
          console.log(`      - Created ${node.type} item`)
        }
        
        // Clear the flow_data to mark as migrated
        const { error: updateError } = await supabase
          .from('onboard_flows')
          .update({ 
            flow_data: null,
            // Add a note that this was migrated
            description: flow.description ? 
              `${flow.description}\n\n[Migrated from legacy flow format]` :
              '[Migrated from legacy flow format]'
          })
          .eq('id', flow.id)
        
        if (updateError) {
          throw updateError
        }
        
        console.log(`  ✅ Successfully migrated flow: ${flow.name}`)
        migratedCount++
        
      } catch (error) {
        console.error(`  ❌ Error migrating flow ${flow.name}:`, error.message)
        errorCount++
      }
    }
    
    console.log('\n=== Migration Summary ===')
    console.log(`Total flows processed: ${flows.length}`)
    console.log(`Successfully migrated: ${migratedCount}`)
    console.log(`Skipped: ${skippedCount}`)
    console.log(`Errors: ${errorCount}`)
    
    if (errorCount > 0) {
      console.log('\n⚠️  Some flows failed to migrate. Check the errors above.')
      console.log('You may need to manually fix these flows or run the script again.')
    }
    
    if (migratedCount > 0) {
      console.log('\n✅ Migration completed successfully!')
      console.log('\nNext steps:')
      console.log('1. Review migrated flows in the admin interface')
      console.log('2. Assign content/assessments to items that need them')
      console.log('3. Test the new flow builder and learner experience')
    }
    
  } catch (error) {
    console.error('Migration failed:', error.message)
    process.exit(1)
  }
}

// Run the migration
migrateFlowsToStages()
  .then(() => {
    console.log('\nMigration process completed.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Migration process failed:', error)
    process.exit(1)
  })
