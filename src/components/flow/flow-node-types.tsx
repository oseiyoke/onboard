'use client'

import { Handle, Position, NodeProps } from 'reactflow'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Brain, 
  Info,
  Play,
  CheckCircle,
  Image as ImageIcon
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

// Stage Node (replaces individual content/assessment/info nodes)
export function StageNode({ data, selected }: NodeProps) {
  const items = data.items || []
  const itemTypes = items.map((item: any) => item.type)
  const hasContent = itemTypes.includes('content')
  const hasAssessment = itemTypes.includes('assessment')
  const hasInfo = itemTypes.includes('info')

  const getStageColor = () => {
    if (hasContent && hasAssessment && hasInfo) return 'border-indigo-500 bg-indigo-50'
    if (hasContent && hasAssessment) return 'border-teal-500 bg-teal-50'
    if (hasContent && hasInfo) return 'border-cyan-500 bg-cyan-50'
    if (hasAssessment && hasInfo) return 'border-violet-500 bg-violet-50'
    if (hasContent) return 'border-blue-500 bg-blue-50'
    if (hasAssessment) return 'border-green-500 bg-green-50'
    if (hasInfo) return 'border-purple-500 bg-purple-50'
    return 'border-gray-300 bg-gray-50'
  }

  return (
    <>
      <Handle type="target" position={Position.Left} />
      <Card 
        className={`
          min-w-[200px] max-w-[250px] transition-all duration-200
          ${selected ? 'ring-2 ring-primary ring-offset-2' : ''}
          ${getStageColor()}
        `}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-8 h-8 bg-white/80 rounded flex items-center justify-center">
                <Play className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <Badge variant="secondary" className="bg-white/80 text-gray-800 text-xs">
                  STAGE
                </Badge>
              </div>
            </div>
            {data.image_url && (
              <div className="w-6 h-6 bg-white/80 rounded flex items-center justify-center">
                <ImageIcon className="w-3 h-3 text-gray-500" />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <h4 className="font-medium text-sm mb-1 truncate">
            {data.title || 'Untitled Stage'}
          </h4>
          {data.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {data.description}
            </p>
          )}
          
          {/* Item type indicators */}
          <div className="flex items-center gap-1 flex-wrap">
            {hasContent && (
              <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                <FileText className="w-3 h-3" />
                <span>{items.filter((i: any) => i.type === 'content').length}</span>
              </div>
            )}
            {hasAssessment && (
              <div className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                <Brain className="w-3 h-3" />
                <span>{items.filter((i: any) => i.type === 'assessment').length}</span>
              </div>
            )}
            {hasInfo && (
              <div className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                <Info className="w-3 h-3" />
                <span>{items.filter((i: any) => i.type === 'info').length}</span>
              </div>
            )}
            {items.length === 0 && (
              <span className="text-xs text-muted-foreground">No items</span>
            )}
          </div>
        </CardContent>
      </Card>
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
  stage: StageNode,
  start: StartNode,
  end: EndNode,
}
