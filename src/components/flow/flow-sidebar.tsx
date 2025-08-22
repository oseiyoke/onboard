'use client'

import { useState, useEffect } from 'react'
import { Node } from 'reactflow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Brain, 
  Info,
  Settings,
  X,
  Plus
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FlowToolbar } from './flow-toolbar'

interface FlowSidebarProps {
  selectedNode: Node | null
  onNodeUpdate: (nodeId: string, updates: Record<string, unknown>) => void
  onAddNode: (type: string) => void
}

const getNodeIcon = (type: string) => {
  switch (type) {
    case 'content': return FileText
    case 'assessment': return Brain
    case 'info': return Info
    default: return FileText
  }
}

const getNodeColor = (type: string) => {
  switch (type) {
    case 'content': return 'bg-blue-100 text-blue-800'
    case 'assessment': return 'bg-green-100 text-green-800'
    case 'info': return 'bg-purple-100 text-purple-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export function FlowSidebar({ selectedNode, onNodeUpdate, onAddNode }: FlowSidebarProps) {
  const [label, setLabel] = useState(selectedNode?.data?.label || '')
  const [content, setContent] = useState(selectedNode?.data?.content || '')
  const [description, setDescription] = useState(selectedNode?.data?.description || '')

  // Update local state when selected node changes
  useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.data?.label || '')
      setContent(selectedNode.data?.content || '')
      setDescription(selectedNode.data?.description || '')
    }
  }, [selectedNode])

  const handleUpdate = (field: string, value: string) => {
    if (!selectedNode) return
    
    onNodeUpdate(selectedNode.id, { [field]: value })
    
    // Update local state
    switch (field) {
      case 'label':
        setLabel(value)
        break
      case 'content':
        setContent(value)
        break
      case 'description':
        setDescription(value)
        break
    }
  }

  if (!selectedNode) {
    return (
      <div className="w-80 border-r bg-card p-4 space-y-4">

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add New Phase</CardTitle>
            <CardDescription>
              Choose a phase type to add to your flow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => onAddNode('content')}
            >
              <FileText className="w-4 h-4" />
              Content Phase
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => onAddNode('assessment')}
            >
              <Brain className="w-4 h-4" />
              Assessment Phase
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => onAddNode('info')}
            >
              <Info className="w-4 h-4" />
              Info Phase
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Flow Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Connect phases by dragging from one node to another</p>
            <p>• Use content phases to share materials</p>
            <p>• Add assessments to test knowledge</p>
            <p>• Info phases provide instructions</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const NodeIcon = getNodeIcon(selectedNode.type || 'content')

  return (
    <div className="w-80 border-r bg-card">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
              <NodeIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold">Edit Phase</h3>
            </div>
          </div>
        </div>
        <Badge className={getNodeColor(selectedNode.type || 'content')}>
          {(selectedNode.type || 'content').toUpperCase()}
        </Badge>
      </div>

      <div className="p-4">
        <Tabs defaultValue="properties" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="label">Phase Name</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => handleUpdate('label', e.target.value)}
                placeholder="Enter phase name..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => handleUpdate('description', e.target.value)}
                placeholder="Describe what this phase covers..."
                rows={2}
              />
            </div>

            {selectedNode.type === 'content' && (
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => handleUpdate('content', e.target.value)}
                  placeholder="Add content or select files to display..."
                  rows={4}
                />
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <Plus className="w-4 h-4" />
                  Add Files
                </Button>
              </div>
            )}

            {selectedNode.type === 'assessment' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Assessment</Label>
                  {selectedNode.data?.assessmentId ? (
                    <div className="space-y-2">
                      <div className="p-3 border rounded bg-muted/50">
                        <h4 className="font-medium text-sm">{selectedNode.data?.assessmentName || 'Selected Assessment'}</h4>
                        <div className="text-xs text-muted-foreground mt-1">
                          {selectedNode.data?.questionCount || 0} questions • {selectedNode.data?.passingScore || 70}% to pass
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          // Clear assessment selection
                          handleUpdate('assessmentId', null)
                          handleUpdate('assessmentName', null)
                          handleUpdate('questionCount', 0)
                          handleUpdate('passingScore', 70)
                        }}
                      >
                        Change Assessment
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground mb-2">
                        Choose an existing assessment or create a new one
                      </p>
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        <Brain className="w-4 h-4" />
                        Select Assessment
                      </Button>
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        <Plus className="w-4 h-4" />
                        Create New Assessment
                      </Button>
                    </div>
                  )}
                </div>

                {selectedNode.data?.assessmentId && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Assessment Settings</Label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Required to pass</span>
                          <input 
                            type="checkbox" 
                            className="rounded"
                            defaultChecked={true}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Allow retries</span>
                          <input 
                            type="checkbox" 
                            className="rounded"
                            defaultChecked={true}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedNode.type === 'info' && (
              <div className="space-y-2">
                <Label htmlFor="info-content">Information</Label>
                <Textarea
                  id="info-content"
                  value={content}
                  onChange={(e) => handleUpdate('content', e.target.value)}
                  placeholder="Enter information to display..."
                  rows={4}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Completion Requirements</Label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Required phase</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Time limit</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Branching Logic</Label>
                <p className="text-xs text-muted-foreground">
                  Configure conditions for proceeding to the next phase
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Add Condition
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
