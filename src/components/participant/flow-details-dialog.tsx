'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { StageProgress } from './stage-progress'
import { ParticipantEnrollment } from '@/lib/services/progress.client'
import { useFlowNavigation } from '@/hooks/use-flows'

interface FlowDetailsDialogProps {
  enrollment: ParticipantEnrollment | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FlowDetailsDialog({ enrollment, open, onOpenChange }: FlowDetailsDialogProps) {
  const { launchFlow } = useFlowNavigation()

  if (!enrollment) {
    return null
  }

  const handleLaunchFlow = () => {
    onOpenChange(false) // Close dialog first
    launchFlow(enrollment)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-2xl lg:max-w-4xl max-h-[80vh] overflow-y-auto mx-4 sm:mx-0">
        <DialogHeader>
          <DialogTitle className="text-xl">{enrollment.flow.name}</DialogTitle>
          {enrollment.flow.description && (
            <DialogDescription className="text-base">
              {enrollment.flow.description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="mt-6">
          <StageProgress 
            enrollmentId={enrollment.id}
            onLaunchFlow={handleLaunchFlow}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

