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
  Plus,
  Image as ImageIcon,
  GripVertical,
  Edit,
  Trash2
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StageWithItems } from '@/lib/services/stage.service'
import { StageItemWithRelations } from '@/lib/services/stage-item.service'
import { ItemEditor } from './item-editors'
import { toast } from 'sonner'

interface FlowSidebarProps {
  selectedNode: Node | null
  stages: StageWithItems[]
  onNodeUpdate: (nodeId: string, updates: Record<string, unknown>) => void
  onAddStage: () => void
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

export function FlowSidebar({ selectedNode, stages, onNodeUpdate, onAddStage }: FlowSidebarProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [editingItem, setEditingItem] = useState<StageItemWithRelations | null>(null)
  const [isItemEditorOpen, setIsItemEditorOpen] = useState(false)
  
  const selectedStage = selectedNode && selectedNode.type === 'stage' 
    ? stages.find(s => s.id === selectedNode.id)
    : null

  // Update local state when selected node changes
  useEffect(() => {
    if (selectedStage) {
      setTitle(selectedStage.title || '')
      setDescription(selectedStage.description || '')
      setImageUrl(selectedStage.image_url || '')
    }
  }, [selectedStage])

  const handleStageUpdate = async (field: string, value: string) => {
    if (!selectedStage) return
    
    try {
      const response = await fetch(`/api/stages/${selectedStage.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      })

      if (!response.ok) {
        throw new Error('Failed to update stage')
      }

      // Update React Flow node data
      onNodeUpdate(selectedStage.id, { [field]: value })
      
      // Update local state
      switch (field) {
        case 'title':
          setTitle(value)
          break
        case 'description':
          setDescription(value)
          break
        case 'image_url':
          setImageUrl(value)
          break
      }
      
      toast.success('Stage updated successfully')
    } catch (error) {
      toast.error('Failed to update stage')
      console.error(error)
    }
  }

  const handleAddItem = async (type: 'content' | 'assessment' | 'info') => {
    if (!selectedStage) return

    try {
      const itemData: any = {
        type,
        title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Item`,
      }

      // Add type-specific defaults
      if (type === 'info') {
        itemData.body = 'Enter your information here...'
      }

      const response = await fetch(`/api/stages/${selectedStage.id}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      })

      if (!response.ok) {
        throw new Error('Failed to add item')
      }

      toast.success('Item added successfully')
    } catch (error) {
      toast.error('Failed to add item')
      console.error(error)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/stage-items/${itemId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete item')
      }

      toast.success('Item deleted successfully')
    } catch (error) {
      toast.error('Failed to delete item')
      console.error(error)
    }
  }

  if (!selectedNode) {
    return (
      <div className="w-80 border-r bg-card p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add New Stage</CardTitle>
            <CardDescription>
              Create a new stage in your learning flow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full justify-center gap-2"
              onClick={onAddStage}
            >
              <Plus className="w-4 h-4" />
              Add Stage
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Flow Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Stages contain multiple learning items</p>
            <p>• Mix content, assessments, and info in one stage</p>
            <p>• Learners complete all items to finish a stage</p>
            <p>• Connect stages to create learning paths</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (selectedNode.type !== 'stage' || !selectedStage) {
    return (
      <div className="w-80 border-r bg-card p-4">
        <p className="text-sm text-muted-foreground">
          Select a stage to edit its properties and items.
        </p>
      </div>
    )
  }

  return (
    <div className="w-80 border-r bg-card">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold">Edit Stage</h3>
            </div>
          </div>
        </div>
        <Badge variant="secondary">
          STAGE
        </Badge>
      </div>

      <div className="p-4">
        <Tabs defaultValue="stage" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stage">Stage</TabsTrigger>
            <TabsTrigger value="items">Items ({selectedStage.items.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="stage" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Stage Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={(e) => handleStageUpdate('title', e.target.value)}
                placeholder="Enter stage title..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={(e) => handleStageUpdate('description', e.target.value)}
                placeholder="Describe what learners will do in this stage..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Image URL (Optional)</Label>
              <Input
                id="image"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onBlur={(e) => handleStageUpdate('image_url', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              {imageUrl && (
                <div className="mt-2">
                  <img 
                    src={imageUrl} 
                    alt="Stage preview" 
                    className="w-full h-24 object-cover rounded border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="items" className="space-y-4">
            <div className="space-y-2">
              <Label>Stage Items</Label>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={() => handleAddItem('content')}
                >
                  <FileText className="w-3 h-3" />
                  Content
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={() => handleAddItem('assessment')}
                >
                  <Brain className="w-3 h-3" />
                  Quiz
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={() => handleAddItem('info')}
                >
                  <Info className="w-3 h-3" />
                  Info
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {selectedStage.items.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">
                    No items in this stage yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add content, assessments, or info above
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedStage.items.map((item, index) => {
                    const ItemIcon = item.type === 'content' ? FileText : 
                                  item.type === 'assessment' ? Brain : Info
                    const typeColor = item.type === 'content' ? 'text-blue-600' :
                                    item.type === 'assessment' ? 'text-green-600' : 'text-purple-600'
                    
                    return (
                      <div key={item.id} className="flex items-center gap-2 p-2 border rounded">
                        <GripVertical className="w-3 h-3 text-muted-foreground cursor-grab" />
                        <ItemIcon className={`w-4 h-4 ${typeColor}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            setEditingItem(item)
                            setIsItemEditorOpen(true)
                          }}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm" 
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Item Editor Dialog */}
      <ItemEditor
        item={editingItem}
        isOpen={isItemEditorOpen}
        onClose={() => {
          setIsItemEditorOpen(false)
          setEditingItem(null)
        }}
      />
    </div>
  )
}
