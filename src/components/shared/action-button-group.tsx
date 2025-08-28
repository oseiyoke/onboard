'use client'

import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export interface ActionButton {
  id: string
  label: string
  icon?: ReactNode
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  loadingText?: string
  className?: string
  shortcut?: string
}

interface ActionButtonGroupProps {
  actions: ActionButton[]
  primaryActions?: string[] // IDs of actions to show as primary
  alignment?: 'left' | 'center' | 'right' | 'space-between'
  showSeparators?: boolean
  className?: string
}

export function ActionButtonGroup({
  actions,
  primaryActions = [],
  alignment = 'right',
  showSeparators = false,
  className
}: ActionButtonGroupProps) {
  const primaryActionButtons = actions.filter(action => primaryActions.includes(action.id))
  const secondaryActionButtons = actions.filter(action => !primaryActions.includes(action.id))
  
  const alignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    'space-between': 'justify-between'
  }

  const renderButton = (action: ActionButton) => (
    <Button
      key={action.id}
      variant={action.variant || 'default'}
      size={action.size || 'default'}
      onClick={action.onClick}
      disabled={action.disabled || action.loading}
      className={cn("gap-2", action.className)}
    >
      {action.loading && (
        <div className="w-4 h-4 border-2 border-b-transparent border-current rounded-full animate-spin" />
      )}
      {!action.loading && action.icon}
      {action.loading ? (action.loadingText || action.label) : action.label}
      {action.shortcut && !action.loading && (
        <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-muted rounded">
          {action.shortcut}
        </kbd>
      )}
    </Button>
  )

  const renderButtonGroup = (buttons: ActionButton[]) => (
    <div className="flex items-center gap-2">
      {buttons.map((action, index) => (
        <div key={action.id} className="flex items-center gap-2">
          {renderButton(action)}
          {showSeparators && index < buttons.length - 1 && (
            <Separator orientation="vertical" className="h-6" />
          )}
        </div>
      ))}
    </div>
  )

  if (alignment === 'space-between' && (primaryActionButtons.length > 0 && secondaryActionButtons.length > 0)) {
    return (
      <div className={cn("flex items-center justify-between", className)}>
        {renderButtonGroup(secondaryActionButtons)}
        {renderButtonGroup(primaryActionButtons)}
      </div>
    )
  }

  // For other alignments, show secondary actions first, then primary
  const allButtons = [...secondaryActionButtons, ...primaryActionButtons]

  return (
    <div className={cn("flex items-center gap-2", alignmentClasses[alignment], className)}>
      {renderButtonGroup(allButtons)}
    </div>
  )
}

// Utility function to create common action patterns
export const createCommonActions = {
  save: (onClick: () => void, { loading = false, disabled = false } = {}): ActionButton => ({
    id: 'save',
    label: 'Save',
    variant: 'default',
    onClick,
    disabled,
    loading,
    loadingText: 'Saving...',
    shortcut: '⌘S'
  }),

  cancel: (onClick: () => void): ActionButton => ({
    id: 'cancel',
    label: 'Cancel',
    variant: 'outline',
    onClick,
    shortcut: 'Esc'
  }),

  delete: (onClick: () => void, { disabled = false } = {}): ActionButton => ({
    id: 'delete',
    label: 'Delete',
    variant: 'destructive',
    onClick,
    disabled
  }),

  edit: (onClick: () => void): ActionButton => ({
    id: 'edit',
    label: 'Edit',
    variant: 'outline',
    onClick
  }),

  back: (onClick: () => void, { disabled = false } = {}): ActionButton => ({
    id: 'back',
    label: 'Back',
    variant: 'outline',
    onClick,
    disabled
  }),

  next: (onClick: () => void, { disabled = false } = {}): ActionButton => ({
    id: 'next',
    label: 'Next',
    variant: 'default',
    onClick,
    disabled
  })
}
