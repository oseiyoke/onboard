'use client'

import { useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/providers/auth-provider'
import ReactFlow, {
  Node,
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
import { Card, CardContent } from '@/components/ui/card'
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

interface FlowBuilderProps {
  flowId: string
}

const nodeTypes = FlowNodeTypes

function FlowBuilderContent({ flowId }: FlowBuilderProps) {
  const { orgId, loading } = useAuth()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Fetch flow data
  const { data: flow, isLoading } = useQuery({
    queryKey: ['flow', flowId, orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('onboard_flows')
        .select('*')
        .eq('id', flowId)
        .eq('org_id', orgId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!flowId && !!orgId && !loading,
  })

  // Load flow data into React Flow
  useEffect(() => {
    if (flow?.flow_data) {
      setNodes(flow.flow_data.nodes || [])
      setEdges(flow.flow_data.edges || [])
    }
  }, [flow, setNodes, setEdges])

  // Save flow mutation
  const saveFlowMutation = useMutation({
    mutationFn: async () => {
      const flowData = { nodes, edges }
      const { error } = await supabase
        .from('onboard_flows')
        .update({ 
          flow_data: flowData,
          updated_at: new Date().toISOString()
        })
        .eq('id', flowId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flow', flowId] })
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

  // Wait for auth/org context before deciding not-found to avoid a false negative
  if (loading || !orgId) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin mb-4" />
          <p>Loading flow...</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin mb-4" />
          <p>Loading flow...</p>
        </div>
      </div>
    )
  }

  if (!flow) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Flow not found</h2>
            <p className="text-muted-foreground mb-4">
              The flow you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
            </p>
            <Button asChild>
              <Link href="/dashboard/flows">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Flows
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

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
              <h1 className="text-xl font-semibold">{flow.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={flow.is_active ? 'default' : 'secondary'}>
                  {flow.is_active ? 'Active' : 'Draft'}
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
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? 'Saving...' : 'Save'}
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
          >
            <Background />
            <Controls />
            <MiniMap />
            
            <Panel position="top-center">
              <FlowToolbar onAddNode={addNode} />
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </div>
  )
}

export function FlowBuilder({ flowId }: FlowBuilderProps) {
  return (
    <ReactFlowProvider>
      <FlowBuilderContent flowId={flowId} />
    </ReactFlowProvider>
  )
}
