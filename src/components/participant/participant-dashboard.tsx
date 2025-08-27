'use client'

import React, { useState, useEffect } from 'react'
import { ParticipantFlowsList } from './participant-flows-list'
import { FlowDetailsDialog } from './flow-details-dialog'
import { useFlowNavigation } from '@/hooks/use-flows'

export function ParticipantDashboard() {
  const { selectedFlow, closeFlowDetails } = useFlowNavigation()
  const [dialogOpen, setDialogOpen] = useState(false)

  // Handle dialog state when selectedFlow changes
  React.useEffect(() => {
    if (selectedFlow) {
      setDialogOpen(true)
    }
  }, [selectedFlow])

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      closeFlowDetails()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'hsl(262, 83%, 58%)' }}>
          My Learning Journey
        </h1>
        <p className="text-muted-foreground">
          Track your progress and continue your onboarding flows
        </p>
      </div>

      <ParticipantFlowsList />

      <FlowDetailsDialog
        enrollment={selectedFlow}
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
      />
    </div>
  )
}
