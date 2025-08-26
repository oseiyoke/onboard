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
  ReactFlowProvider,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { StageWithItems } from '@/lib/services/stage.service'
import { toast } from 'sonner'

interface FlowBuilderProps {
  initialFlow: Flow
  stages: StageWithItems[]
}

const nodeTypes = FlowNodeTypes

function FlowBuilderContent({ initialFlow, stages }: FlowBuilderProps) {
  // Convert stages to React Flow nodes
  const convertStagesToNodes = (stagesList: StageWithItems[]): Node[] => {
    const stageNodes: Node[] = stagesList.map((stage, index) => ({
      id: stage.id,
      type: 'stage',
      position: { x: 300 + (index * 250), y: 100 + (index % 2 * 150) }, // Stagger positions
      data: {
        stageId: stage.id,
        title: stage.title,
        description: stage.description,
        image_url: stage.image_url,
        items: stage.items,
        position: stage.position,
      }
    }))

    // Add start node
    const startNode: Node = {
      id: 'start',
      type: 'start',
      position: { x: 50, y: 150 },
      data: { label: 'Start' }
    }

    return [startNode, ...stageNodes]
  }

  // Generate simple linear edges between stages
  const generateEdges = (stagesList: StageWithItems[]): Edge[] => {
    const edges: Edge[] = []
    
    if (stagesList.length > 0) {
      // Connect start to first stage
      edges.push({
        id: `start-${stagesList[0].id}`,
        source: 'start',
        target: stagesList[0].id,
      })

      // Connect stages in sequence
      for (let i = 0; i < stagesList.length - 1; i++) {
        edges.push({
          id: `${stagesList[i].id}-${stagesList[i + 1].id}`,
          source: stagesList[i].id,
          target: stagesList[i + 1].id,
        })
      }
    }

    return edges
  }

  const [nodes, setNodes, onNodesChange] = useNodesState(convertStagesToNodes(stages))
  const [edges, setEdges, onEdgesChange] = useEdgesState(generateEdges(stages))
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

  const addStage = useCallback(async () => {
    try {
      const response = await fetch(`/api/flows/${initialFlow.id}/stages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Stage ${stages.length + 1}`,
          description: '',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create stage')
      }

      const { stage } = await response.json()
      
      // Add new node to the canvas
      const newNode: Node = {
        id: stage.id,
        type: 'stage',
        position: { x: 300 + (stages.length * 250), y: 100 + (stages.length % 2 * 150) },
        data: {
          stageId: stage.id,
          title: stage.title,
          description: stage.description,
          image_url: stage.image_url,
          items: [],
          position: stage.position,
        }
      }

      setNodes((nds) => [...nds, newNode])
      
      // Update edges to connect the new stage
      if (stages.length > 0) {
        const lastStageId = stages[stages.length - 1].id
        const newEdge: Edge = {
          id: `${lastStageId}-${stage.id}`,
          source: lastStageId,
          target: stage.id,
        }
        setEdges((eds) => [...eds, newEdge])
      } else {
        // Connect start to this first stage
        const newEdge: Edge = {
          id: `start-${stage.id}`,
          source: 'start',
          target: stage.id,
        }
        setEdges((eds) => [...eds, newEdge])
      }

      toast.success('Stage created successfully')
    } catch (error) {
      toast.error('Failed to create stage')
      console.error(error)
    }
  }, [initialFlow.id, stages, setNodes, setEdges])

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
                  {stages.length} stage{stages.length !== 1 ? 's' : ''}
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
          stages={stages}
          onNodeUpdate={(nodeId, updates) => {
            setNodes((nds) => 
              nds.map((node) => 
                node.id === nodeId 
                  ? { ...node, data: { ...node.data, ...updates } }
                  : node
              )
            )
          }}
          onAddStage={addStage}
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

export function FlowBuilder({ initialFlow, stages }: FlowBuilderProps) {
  return (
    <ReactFlowProvider>
      <FlowBuilderContent initialFlow={initialFlow} stages={stages} />
    </ReactFlowProvider>
  )
}
