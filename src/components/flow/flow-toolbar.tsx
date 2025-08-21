'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  FileText, 
  Brain, 
  Info,
  Plus
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface FlowToolbarProps {
  onAddNode: (type: string) => void
}

const nodeTypes = [
  {
    type: 'content',
    label: 'Content Phase',
    icon: FileText,
    description: 'Display content like PDFs, videos, or documents'
  },
  {
    type: 'assessment',
    label: 'Assessment Phase', 
    icon: Brain,
    description: 'Add quizzes and knowledge checks'
  },
  {
    type: 'info',
    label: 'Info Phase',
    icon: Info,
    description: 'Show information or instructions'
  }
]

export function FlowToolbar({ onAddNode }: FlowToolbarProps) {
  return (
    <Card>
      <CardContent className="p-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground px-2">
            Add Phase:
          </span>
          
          {nodeTypes.map((nodeType) => {
            const Icon = nodeType.icon
            return (
              <Button
                key={nodeType.type}
                variant="outline"
                size="sm"
                onClick={() => onAddNode(nodeType.type)}
                className="gap-2"
              >
                <Icon className="w-4 h-4" />
                {nodeType.label}
              </Button>
            )
          })}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                More
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {nodeTypes.map((nodeType) => {
                const Icon = nodeType.icon
                return (
                  <DropdownMenuItem
                    key={nodeType.type}
                    onClick={() => onAddNode(nodeType.type)}
                    className="gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    <div>
                      <div className="font-medium">{nodeType.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {nodeType.description}
                      </div>
                    </div>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}
