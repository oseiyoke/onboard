'use client'

import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlowProvider,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FlowToolbar } from './flow-toolbar'
import { FlowNodeTypes } from './flow-node-types'
import { FlowSidebar } from './flow-sidebar'
import { 
  Save, 
  Play, 
  ArrowLeft,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { Flow } from '@/lib/services/flow.service'
import { toast } from 'sonner'

interface FlowBuilderProps {
  initialFlow: Flow
}

const nodeTypes = FlowNodeTypes

function FlowBuilderContent({ initialFlow }: FlowBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    (initialFlow.flow_data as { nodes?: Node[] })?.nodes || []
  )
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    (initialFlow.flow_data as { edges?: Edge[] })?.edges || []
  )
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Save flow mutation using API
  const saveFlowMutation = useMutation({
    mutationFn: async () => {
      const flowData = { nodes, edges }
      
      const response = await fetch(`/api/flows/${initialFlow.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ flow_data: flowData }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save flow')
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success('Flow saved successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to save: ${error.message}`)
    },
  })

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await saveFlowMutation.mutateAsync()
    } finally {
      setIsSaving(false)
    }
  }

  const addNode = useCallback((type: string, position?: { x: number; y: number }) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position: position || { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: {
        label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Phase`,
        content: '',
        settings: {}
      }
    }
    setNodes((nds) => [...nds, newNode])
  }, [setNodes])

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/flows">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{initialFlow.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={initialFlow.is_active ? 'default' : 'secondary'}>
                  {initialFlow.is_active ? 'Active' : 'Draft'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {nodes.length} phase{nodes.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={isSaving || saveFlowMutation.isPending}
              className="gap-2"
            >
              {isSaving || saveFlowMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving || saveFlowMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
            <Button className="gap-2">
              <Play className="w-4 h-4" />
              Preview
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <FlowSidebar 
          selectedNode={selectedNode}
          onNodeUpdate={(nodeId, updates) => {
            setNodes((nds) => 
              nds.map((node) => 
                node.id === nodeId 
                  ? { ...node, data: { ...node.data, ...updates } }
                  : node
              )
            )
          }}
          onAddNode={addNode}
        />

        {/* Flow Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-muted/5"
            defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
          >
            <Background />
            <Controls />
            <MiniMap />
            
          </ReactFlow>
        </div>
      </div>
    </div>
  )
}

export function FlowBuilder({ initialFlow }: FlowBuilderProps) {
  return (
    <ReactFlowProvider>
      <FlowBuilderContent initialFlow={initialFlow} />
    </ReactFlowProvider>
  )
}
