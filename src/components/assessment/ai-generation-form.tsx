'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { ContentSelector } from './content-selector'
import { Loader2, Wand2 } from 'lucide-react'

type CreationMethod = 'content' | 'youtube' | 'prompt'

interface AssessmentData {
  name: string
  description?: string
}

interface GenerationData {
  type: CreationMethod
  contentId?: string
  youtubeUrl?: string
  prompt?: string
  questionCount: number
  difficulty: 'easy' | 'medium' | 'hard'
  questionTypes: string[]
  assessmentName: string
}

interface AIGenerationFormProps {
  creationMethod: CreationMethod
  assessmentData: AssessmentData
  onGenerate: (data: GenerationData) => void
  isGenerating: boolean
}

export function AIGenerationForm({ creationMethod, assessmentData, onGenerate, isGenerating }: AIGenerationFormProps) {
  const [selectedContentId, setSelectedContentId] = useState<string>('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [prompt, setPrompt] = useState('')
  const [questionCount, setQuestionCount] = useState(5)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [questionTypes, setQuestionTypes] = useState({
    multiple_choice: true,
    true_false: true,
    multi_select: false,
    short_answer: false,
  })

  const handleGenerate = () => {
    const generationData = {
      type: creationMethod,
      contentId: creationMethod === 'content' ? selectedContentId : undefined,
      youtubeUrl: creationMethod === 'youtube' ? youtubeUrl : undefined,
      prompt: creationMethod === 'prompt' ? prompt : undefined,
      questionCount,
      difficulty,
      questionTypes: Object.entries(questionTypes)
        .filter(([, enabled]) => enabled)
        .map(([type]) => type),
      assessmentName: assessmentData.name,
    }

    onGenerate(generationData)
  }

  const isValid = () => {
    switch (creationMethod) {
      case 'content':
        return selectedContentId.length > 0
      case 'youtube':
        return youtubeUrl.length > 0 && youtubeUrl.includes('youtube.com')
      case 'prompt':
        return prompt.trim().length > 0
      default:
        return false
    }
  }

  const selectedQuestionTypeCount = Object.values(questionTypes).filter(Boolean).length

  return (
    <div className="space-y-6">
      {/* Content Source */}
      <Card>
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-4">Content Source</h4>
          
          {creationMethod === 'content' && (
            <div className="space-y-4">
              <Label>Select Content from Library</Label>
              <ContentSelector
                selectedContentId={selectedContentId}
                onSelectContent={setSelectedContentId}
              />
            </div>
          )}

          {creationMethod === 'youtube' && (
            <div className="space-y-2">
              <Label htmlFor="youtube-url">YouTube Video URL</Label>
              <Input
                id="youtube-url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                We'll extract the transcript and generate questions from the video content
              </p>
            </div>
          )}

          {creationMethod === 'prompt' && (
            <div className="space-y-2">
              <Label htmlFor="prompt">Describe what you want to assess</Label>
              <Textarea
                id="prompt"
                placeholder="e.g., I want to test understanding of our company's customer service policies, including response times, escalation procedures, and quality standards..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Be specific about the topics, concepts, or skills you want to assess
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generation Settings */}
      <Card>
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-4">Generation Settings</h4>
          
          <div className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="question-count">Number of Questions</Label>
                <Select value={questionCount.toString()} onValueChange={(v) => setQuestionCount(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 questions</SelectItem>
                    <SelectItem value="5">5 questions</SelectItem>
                    <SelectItem value="8">8 questions</SelectItem>
                    <SelectItem value="10">10 questions</SelectItem>
                    <SelectItem value="15">15 questions</SelectItem>
                    <SelectItem value="20">20 questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy - Basic recall</SelectItem>
                    <SelectItem value="medium">Medium - Understanding</SelectItem>
                    <SelectItem value="hard">Hard - Application</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Question Types</Label>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="multiple-choice"
                    checked={questionTypes.multiple_choice}
                    onCheckedChange={(checked) => 
                      setQuestionTypes(prev => ({ ...prev, multiple_choice: checked as boolean }))
                    }
                  />
                  <Label htmlFor="multiple-choice">Multiple Choice</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="true-false"
                    checked={questionTypes.true_false}
                    onCheckedChange={(checked) => 
                      setQuestionTypes(prev => ({ ...prev, true_false: checked as boolean }))
                    }
                  />
                  <Label htmlFor="true-false">True/False</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="multi-select"
                    checked={questionTypes.multi_select}
                    onCheckedChange={(checked) => 
                      setQuestionTypes(prev => ({ ...prev, multi_select: checked as boolean }))
                    }
                  />
                  <Label htmlFor="multi-select">Multiple Select</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="short-answer"
                    checked={questionTypes.short_answer}
                    onCheckedChange={(checked) => 
                      setQuestionTypes(prev => ({ ...prev, short_answer: checked as boolean }))
                    }
                  />
                  <Label htmlFor="short-answer">Short Answer</Label>
                </div>
              </div>
              {selectedQuestionTypeCount === 0 && (
                <p className="text-sm text-destructive">Please select at least one question type</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleGenerate}
          disabled={!isValid() || selectedQuestionTypeCount === 0 || isGenerating}
          className="gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating Questions...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              Generate Questions
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
