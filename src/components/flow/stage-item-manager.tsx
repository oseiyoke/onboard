'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useContent } from '@/hooks/use-content'
import { useAssessments } from '@/hooks/use-assessments'
import { 
  Plus,
  Trash2,
  FileText,
  ClipboardCheck,
  Info,
  ChevronUp,
  ChevronDown,
  Edit,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { StageWithItems, StageItem } from '@/lib/services/stage.service'

interface StageItemManagerProps {
  stage: StageWithItems
  onUpdateStage: (updates: Partial<StageWithItems>) => void
}

interface NewItemForm {
  type: 'content' | 'assessment' | 'info'
  title: string
  body?: string
  contentId?: string
  assessmentId?: string
}

const ITEM_TYPES = [
  { 
    value: 'content', 
    label: 'Content', 
    icon: FileText, 
    description: 'Documents, videos, or other learning materials',
    color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300'
  },
  { 
    value: 'assessment', 
    label: 'Assessment', 
    icon: ClipboardCheck, 
    description: 'Quizzes, tests, or other evaluations',
    color: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300'
  },
  { 
    value: 'info', 
    label: 'Info Block', 
    icon: Info, 
    description: 'Text-based information or instructions',
    color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300'
  },
] as const

export function StageItemManager({ stage, onUpdateStage }: StageItemManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState<NewItemForm>({
    type: 'content',
    title: ''
  })
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const items = stage.items || []

  // Content Dropdown Component
  const ContentDropdown = () => {
    const { data: contentData, isLoading: contentLoading } = useContent({ limit: 100 })
    const content = contentData?.data || []

    return (
      <div className="space-y-2">
        <Label>Select Content (optional)</Label>
        <Select 
          value={newItem.contentId || 'none'} 
          onValueChange={(value) => setNewItem(prev => ({ ...prev, contentId: value === 'none' ? undefined : value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder={contentLoading ? "Loading content..." : "Select content item"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No content selected</SelectItem>
            {content.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs capitalize">
                    {item.type}
                  </Badge>
                  <span className="truncate">{item.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  // Assessment Dropdown Component
  const AssessmentDropdown = () => {
    const { data: assessmentData, isLoading: assessmentLoading } = useAssessments({ limit: 100 })
    const assessments = assessmentData?.assessments || []

    return (
      <div className="space-y-2">
        <Label>Select Assessment (optional)</Label>
        <Select 
          value={newItem.assessmentId || 'none'} 
          onValueChange={(value) => setNewItem(prev => ({ ...prev, assessmentId: value === 'none' ? undefined : value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder={assessmentLoading ? "Loading assessments..." : "Select assessment"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No assessment selected</SelectItem>
            {assessments.map((assessment) => (
              <SelectItem key={assessment.id} value={assessment.id}>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {assessment.passing_score}% pass
                  </Badge>
                  <span className="truncate">{assessment.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  const handleAddItem = async () => {
    if (!newItem.title.trim()) {
      toast.error('Please enter a title for the item')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/stages/${stage.id}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: newItem.type,
          title: newItem.title,
          ...(newItem.body ? { body: newItem.body } : {}),
          ...(newItem.contentId ? { content_id: newItem.contentId } : {}),
          ...(newItem.assessmentId ? { assessment_id: newItem.assessmentId } : {}),
          position: items.length,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add item')
      }

      const { item } = await response.json()
      
      onUpdateStage({
        items: [...items, item]
      })

      setNewItem({ type: 'content', title: '' })
      setShowAddForm(false)
      toast.success('Item added successfully!')
    } catch (error) {
      console.error('Failed to add item:', error)
      toast.error('Failed to add item')
    } finally {
      setIsLoading(false)
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

      onUpdateStage({
        items: items.filter(item => item.id !== itemId)
      })

      toast.success('Item deleted successfully!')
    } catch (error) {
      console.error('Failed to delete item:', error)
      toast.error('Failed to delete item')
    }
  }

  const handleUpdateItem = async (itemId: string, updates: Partial<StageItem>) => {
    try {
      const response = await fetch(`/api/stage-items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update item')
      }

      onUpdateStage({
        items: items.map(item => 
          item.id === itemId ? { ...item, ...updates } : item
        )
      })

      setEditingItem(null)
      toast.success('Item updated successfully!')
    } catch (error) {
      console.error('Failed to update item:', error)
      toast.error('Failed to update item')
    }
  }

  const moveItem = async (itemId: string, direction: 'up' | 'down') => {
    const itemIndex = items.findIndex(item => item.id === itemId)
    if (itemIndex === -1) return

    const newIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1
    if (newIndex < 0 || newIndex >= items.length) return

    const newItems = [...items]
    const [movedItem] = newItems.splice(itemIndex, 1)
    newItems.splice(newIndex, 0, movedItem)

    // Update positions
    const itemsWithNewPositions = newItems.map((item, index) => ({
      ...item,
      position: index
    }))

    try {
      // Update positions in the database
      await Promise.all(itemsWithNewPositions.map(item => 
        fetch(`/api/stage-items/${item.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ position: item.position }),
        })
      ))

      onUpdateStage({ items: itemsWithNewPositions })
    } catch (error) {
      console.error('Failed to reorder items:', error)
      toast.error('Failed to reorder items')
    }
  }

  const getItemTypeConfig = (type: StageItem['type']) => {
    return ITEM_TYPES.find(t => t.value === type) || ITEM_TYPES[0]
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Stage Items</h3>
        <Button
          onClick={() => setShowAddForm(true)}
          size="sm"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </Button>
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-6 pb-6 text-center">
              <Info className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                No items yet. Add content, assessments, or info blocks to this stage.
              </p>
            </CardContent>
          </Card>
        ) : (
          items.map((item, index) => {
            const typeConfig = getItemTypeConfig(item.type)
            const Icon = typeConfig.icon
            const isEditing = editingItem === item.id

            return (
              <Card key={item.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant="outline" 
                        className={cn("gap-2", typeConfig.color)}
                      >
                        <Icon className="w-3 h-3" />
                        {typeConfig.label}
                      </Badge>
                      
                      {isEditing ? (
                        <Input
                          value={item.title}
                          onChange={(e) => 
                            onUpdateStage({
                              items: items.map(i => 
                                i.id === item.id ? { ...i, title: e.target.value } : i
                              )
                            })
                          }
                          className="h-7 text-sm font-medium"
                          onBlur={() => handleUpdateItem(item.id, { title: item.title })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateItem(item.id, { title: item.title })
                            } else if (e.key === 'Escape') {
                              setEditingItem(null)
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <h4 className="font-medium text-sm">{item.title}</h4>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-6 w-6"
                        onClick={() => moveItem(item.id, 'up')}
                        disabled={index === 0}
                      >
                        <ChevronUp className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-6 w-6"
                        onClick={() => moveItem(item.id, 'down')}
                        disabled={index === items.length - 1}
                      >
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-6 w-6"
                        onClick={() => setEditingItem(item.id)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-6 w-6 text-destructive"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {(item.body || item.content_id || item.assessment_id) && (
                  <CardContent className="pt-0">
                    {item.body && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.body}
                      </p>
                    )}
                    {item.content_id && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <ExternalLink className="w-3 h-3" />
                        Content Reference: {item.content_id}
                      </div>
                    )}
                    {item.assessment_id && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <ExternalLink className="w-3 h-3" />
                        Assessment Reference: {item.assessment_id}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })
        )}
      </div>

      {/* Add Item Form */}
      {showAddForm && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">Add New Item</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Item Type</Label>
              <Select
                value={newItem.type}
                onValueChange={(value: 'content' | 'assessment' | 'info') => 
                  setNewItem(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_TYPES.map((type) => {
                    const Icon = type.icon
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <div>
                            <div className="font-medium">{type.label}</div>
                          </div>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Item Title</Label>
              <Input
                value={newItem.title}
                onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter item title"
              />
            </div>

            {newItem.type === 'info' && (
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={newItem.body || ''}
                  onChange={(e) => setNewItem(prev => ({ ...prev, body: e.target.value }))}
                  placeholder="Enter the information content"
                  rows={3}
                />
              </div>
            )}

            {newItem.type === 'content' && <ContentDropdown />}

            {newItem.type === 'assessment' && <AssessmentDropdown />}

            <div className="flex gap-2">
              <Button
                onClick={handleAddItem}
                disabled={!newItem.title.trim() || isLoading}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                {isLoading ? 'Adding...' : 'Add Item'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false)
                  setNewItem({ type: 'content', title: '' })
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
