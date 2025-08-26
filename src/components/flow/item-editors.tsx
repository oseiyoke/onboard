'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  FileText, 
  Brain, 
  Info,
  Save,
  X,
  Upload,
  Link,
  Plus
} from 'lucide-react'
import { StageItemWithRelations } from '@/lib/services/stage-item.service'
import { toast } from 'sonner'

interface ItemEditorProps {
  item: StageItemWithRelations
  isOpen: boolean
  onClose: () => void
  onSave: (itemId: string, updates: any) => void
}

// Content Item Editor
export function ContentItemEditor({ item, isOpen, onClose, onSave }: ItemEditorProps) {
  const [title, setTitle] = useState(item.title)
  const [contentId, setContentId] = useState(item.content_id || '')
  const [availableContent, setAvailableContent] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchAvailableContent()
    }
  }, [isOpen])

  const fetchAvailableContent = async () => {
    try {
      const response = await fetch('/api/content')
      if (response.ok) {
        const { content } = await response.json()
        setAvailableContent(content || [])
      }
    } catch (error) {
      console.error('Failed to fetch content:', error)
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title')
      return
    }

    setIsLoading(true)
    try {
      await onSave(item.id, {
        title: title.trim(),
        content_id: contentId || null,
      })
      onClose()
      toast.success('Content item updated')
    } catch (error) {
      toast.error('Failed to update content item')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Edit Content Item
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter content title..."
            />
          </div>

          <div>
            <Label htmlFor="content">Select Content</Label>
            <Select value={contentId} onValueChange={setContentId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose existing content or create new..." />
              </SelectTrigger>
              <SelectContent>
                {availableContent.map((content) => (
                  <SelectItem key={content.id} value={content.id}>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <div>
                        <p className="font-medium">{content.name}</p>
                        <p className="text-xs text-muted-foreground">{content.type}</p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 gap-2" size="sm">
              <Upload className="w-4 h-4" />
              Upload New File
            </Button>
            <Button variant="outline" className="flex-1 gap-2" size="sm">
              <Link className="w-4 h-4" />
              Add Link
            </Button>
          </div>

          {item.content && (
            <>
              <Separator />
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Current Content</h4>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <div>
                    <p className="font-medium">{item.content.name}</p>
                    <p className="text-sm text-muted-foreground">{item.content.type}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Assessment Item Editor
export function AssessmentItemEditor({ item, isOpen, onClose, onSave }: ItemEditorProps) {
  const [title, setTitle] = useState(item.title)
  const [assessmentId, setAssessmentId] = useState(item.assessment_id || '')
  const [availableAssessments, setAvailableAssessments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchAvailableAssessments()
    }
  }, [isOpen])

  const fetchAvailableAssessments = async () => {
    try {
      const response = await fetch('/api/assessments')
      if (response.ok) {
        const { assessments } = await response.json()
        setAvailableAssessments(assessments || [])
      }
    } catch (error) {
      console.error('Failed to fetch assessments:', error)
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title')
      return
    }

    if (!assessmentId) {
      toast.error('Please select an assessment')
      return
    }

    setIsLoading(true)
    try {
      await onSave(item.id, {
        title: title.trim(),
        assessment_id: assessmentId,
      })
      onClose()
      toast.success('Assessment item updated')
    } catch (error) {
      toast.error('Failed to update assessment item')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Edit Assessment Item
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter assessment title..."
            />
          </div>

          <div>
            <Label htmlFor="assessment">Select Assessment</Label>
            <Select value={assessmentId} onValueChange={setAssessmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an existing assessment..." />
              </SelectTrigger>
              <SelectContent>
                {availableAssessments.map((assessment) => (
                  <SelectItem key={assessment.id} value={assessment.id}>
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      <div>
                        <p className="font-medium">{assessment.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Passing Score: {assessment.passing_score}%
                        </p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="w-full gap-2" size="sm">
              <Plus className="w-4 h-4" />
              Create New Assessment
            </Button>
          </div>

          {item.assessment && (
            <>
              <Separator />
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Current Assessment</h4>
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4" />
                  <div>
                    <p className="font-medium">{item.assessment.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Passing Score: {item.assessment.passing_score}%
                    </p>
                  </div>
                </div>
                {item.assessment.question_count && (
                  <Badge variant="secondary">
                    {item.assessment.question_count} questions
                  </Badge>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !assessmentId}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Info Item Editor
export function InfoItemEditor({ item, isOpen, onClose, onSave }: ItemEditorProps) {
  const [title, setTitle] = useState(item.title)
  const [body, setBody] = useState(item.body || '')
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title')
      return
    }

    if (!body.trim()) {
      toast.error('Please enter some content')
      return
    }

    setIsLoading(true)
    try {
      await onSave(item.id, {
        title: title.trim(),
        body: body.trim(),
      })
      onClose()
      toast.success('Info item updated')
    } catch (error) {
      toast.error('Failed to update info item')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Edit Info Item
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter info title..."
            />
          </div>

          <div>
            <Label htmlFor="body">Content</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter the information content..."
              rows={8}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              You can use plain text or basic markdown formatting.
            </p>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Preview</h4>
            <div className="prose prose-sm max-w-none">
              {body ? (
                <p className="whitespace-pre-wrap">{body}</p>
              ) : (
                <p className="text-muted-foreground italic">Content preview will appear here...</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !body.trim()}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Main Item Editor Component
export function ItemEditor({ 
  item, 
  isOpen, 
  onClose 
}: { 
  item: StageItemWithRelations | null
  isOpen: boolean
  onClose: () => void 
}) {
  const handleSave = async (itemId: string, updates: any) => {
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
  }

  if (!item) return null

  if (item.type === 'content') {
    return (
      <ContentItemEditor 
        item={item} 
        isOpen={isOpen} 
        onClose={onClose} 
        onSave={handleSave} 
      />
    )
  }

  if (item.type === 'assessment') {
    return (
      <AssessmentItemEditor 
        item={item} 
        isOpen={isOpen} 
        onClose={onClose} 
        onSave={handleSave} 
      />
    )
  }

  if (item.type === 'info') {
    return (
      <InfoItemEditor 
        item={item} 
        isOpen={isOpen} 
        onClose={onClose} 
        onSave={handleSave} 
      />
    )
  }

  return null
}
