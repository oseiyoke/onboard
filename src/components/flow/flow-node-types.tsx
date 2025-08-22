'use client'

import { Handle, Position, NodeProps } from 'reactflow'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Brain, 
  Info,
  Play,
  CheckCircle
} from 'lucide-react'

// Base node component with common styling
function BaseNode({ 
  children, 
  selected, 
  type, 
  className = '' 
}: { 
  children: React.ReactNode
  selected?: boolean
  type: string
  className?: string 
}) {
  const getTypeColor = (nodeType: string) => {
    switch (nodeType) {
      case 'content': return 'border-blue-500 bg-blue-50'
      case 'assessment': return 'border-green-500 bg-green-50'
      case 'info': return 'border-purple-500 bg-purple-50'
      case 'start': return 'border-gray-500 bg-gray-50'
      default: return 'border-gray-300 bg-white'
    }
  }

  return (
    <Card 
      className={`
        min-w-[200px] max-w-[250px] transition-all duration-200
        ${selected ? 'ring-2 ring-primary ring-offset-2' : ''}
        ${getTypeColor(type)}
        ${className}
      `}
    >
      {children}
    </Card>
  )
}

// Content Phase Node
export function ContentNode({ data, selected }: NodeProps) {
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <BaseNode selected={selected} type="content">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                CONTENT
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <h4 className="font-medium text-sm mb-1 truncate">
            {data.label || 'Content Phase'}
          </h4>
          {data.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {data.description}
            </p>
          )}
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <FileText className="w-3 h-3" />
            <span>0 files</span>
          </div>
        </CardContent>
      </BaseNode>
      <Handle type="source" position={Position.Right} />
    </>
  )
}

// Assessment Phase Node
export function AssessmentNode({ data, selected }: NodeProps) {
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <BaseNode selected={selected} type="assessment">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
              <Brain className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                ASSESSMENT
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <h4 className="font-medium text-sm mb-1 truncate">
            {data.label || 'Assessment Phase'}
          </h4>
          {data.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {data.description}
            </p>
          )}
          <div className="mt-2 space-y-1">
            {data.assessmentId ? (
              <>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Brain className="w-3 h-3" />
                  <span>{data.questionCount || 0} questions</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>Pass: {data.passingScore || 70}%</span>
                </div>
              </>
            ) : (
              <div className="text-xs text-orange-600">
                No assessment selected
              </div>
            )}
          </div>
        </CardContent>
      </BaseNode>
      <Handle type="source" position={Position.Right} />
    </>
  )
}

// Info Phase Node
export function InfoNode({ data, selected }: NodeProps) {
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <BaseNode selected={selected} type="info">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
              <Info className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                INFO
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <h4 className="font-medium text-sm mb-1 truncate">
            {data.label || 'Info Phase'}
          </h4>
          {data.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {data.description}
            </p>
          )}
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Info className="w-3 h-3" />
            <span>Information</span>
          </div>
        </CardContent>
      </BaseNode>
      <Handle type="source" position={Position.Right} />
    </>
  )
}

// Start Node
export function StartNode({ data, selected }: NodeProps) {
  return (
    <>
      <BaseNode selected={selected} type="start">
        <CardContent className="p-4 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Play className="w-6 h-6 text-green-600" />
          </div>
          <h4 className="font-medium text-sm">
            {data.label || 'Start'}
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            Flow begins here
          </p>
        </CardContent>
      </BaseNode>
      <Handle type="source" position={Position.Right} />
    </>
  )
}

// End Node
export function EndNode({ data, selected }: NodeProps) {
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <BaseNode selected={selected} type="end">
        <CardContent className="p-4 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <CheckCircle className="w-6 h-6 text-blue-600" />
          </div>
          <h4 className="font-medium text-sm">
            {data.label || 'Complete'}
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            Flow ends here
          </p>
        </CardContent>
      </BaseNode>
    </>
  )
}

// Export all node types
export const FlowNodeTypes = {
  content: ContentNode,
  assessment: AssessmentNode,
  info: InfoNode,
  start: StartNode,
  end: EndNode,
}
