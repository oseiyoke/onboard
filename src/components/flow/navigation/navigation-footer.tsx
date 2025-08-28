'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight } from 'lucide-react'

interface NavigationFooterProps {
  canGoBack: boolean
  canGoNext: boolean
  onBack: () => void
  onNext: () => void
  backLabel?: string
  nextLabel?: string
}

export function NavigationFooter({
  canGoBack,
  canGoNext,
  onBack,
  onNext,
  backLabel = "Previous",
  nextLabel = "Next"
}: NavigationFooterProps) {
  return (
    <div className="border-t bg-card p-4 flex justify-between">
      <Button
        variant="outline"
        onClick={onBack}
        disabled={!canGoBack}
        className="gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        {backLabel}
      </Button>
      
      <Button
        onClick={onNext}
        disabled={!canGoNext}
        className="gap-2"
      >
        {nextLabel}
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  )
}
