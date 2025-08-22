'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { AssessmentMetadataForm } from './assessment-metadata-form'
import { QuestionBuilder } from './question-builder'
import { ContentSelector } from './content-selector'
import { AIGenerationForm } from './ai-generation-form'
import { AssessmentPreview } from './assessment-preview'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Save, Eye, Wand2, Plus } from 'lucide-react'

type CreationMethod = 'manual' | 'content' | 'youtube' | 'prompt'

interface AssessmentBuilderProps {
  creationMethod: CreationMethod
  assessmentId?: string // For editing existing assessments
  onCancel: () => void
}

export interface AssessmentData {
  name: string
  description: string
  passingScore: number
  retryLimit: number
  timeLimitSeconds?: number
  randomizeQuestions: boolean
  randomizeAnswers: boolean
  showFeedback: boolean
  showCorrectAnswers: boolean
}

export interface Question {
  id: string
  type: 'multiple_choice' | 'multi_select' | 'true_false' | 'short_answer' | 'essay'
  question: string
  options: string[]
  correctAnswer: any
  explanation: string
  points: number
  position: number
}

export function AssessmentBuilder({ creationMethod, assessmentId, onCancel }: AssessmentBuilderProps) {
  const [currentTab, setCurrentTab] = useState('metadata')
  const [assessmentData, setAssessmentData] = useState<AssessmentData>({
    name: '',
    description: '',
    passingScore: 70,
    retryLimit: 3,
    randomizeQuestions: false,
    randomizeAnswers: true,
    showFeedback: true,
    showCorrectAnswers: true,
  })
  const [questions, setQuestions] = useState<Question[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Auto-advance to appropriate tab based on creation method
  useEffect(() => {
    if (creationMethod !== 'manual' && currentTab === 'metadata') {
      setCurrentTab('generation')
    }
  }, [creationMethod, currentTab])

  const handleGenerateQuestions = async (generationData: any) => {
    setIsGenerating(true)
    try {
      // TODO: Call API to generate questions
      console.log('Generating questions with:', generationData)
      
      // Mock generated questions
      const mockQuestions: Question[] = [
        {
          id: '1',
          type: 'multiple_choice',
          question: 'What is the main concept discussed in the content?',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: 'Option A',
          explanation: 'This is the correct answer because...',
          points: 1,
          position: 0
        },
        {
          id: '2',
          type: 'true_false',
          question: 'The content emphasizes the importance of teamwork.',
          options: [],
          correctAnswer: true,
          explanation: 'The content clearly states that teamwork is essential.',
          points: 1,
          position: 1
        }
      ]
      
      setQuestions(mockQuestions)
      setCurrentTab('questions')
    } catch (error) {
      console.error('Generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveAssessment = async () => {
    setIsSaving(true)
    try {
      // TODO: Call API to save assessment
      console.log('Saving assessment:', { assessmentData, questions })
      // Redirect to assessments list on success
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublishAssessment = async () => {
    await handleSaveAssessment()
    // TODO: Publish the assessment
    console.log('Publishing assessment')
  }

  const isReadyToSave = assessmentData.name && questions.length > 0

  return (
    <div className="flex flex-col gap-6">
      {/* Progress Steps */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className={currentTab === 'metadata' ? 'text-foreground font-medium' : ''}>
          1. Assessment Details
        </span>
        <span>→</span>
        {creationMethod !== 'manual' && (
          <>
            <span className={currentTab === 'generation' ? 'text-foreground font-medium' : ''}>
              2. AI Generation
            </span>
            <span>→</span>
          </>
        )}
        <span className={currentTab === 'questions' ? 'text-foreground font-medium' : ''}>
          {creationMethod !== 'manual' ? '3' : '2'}. Questions
        </span>
        <span>→</span>
        <span className={currentTab === 'preview' ? 'text-foreground font-medium' : ''}>
          {creationMethod !== 'manual' ? '4' : '3'}. Preview
        </span>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="metadata">Details</TabsTrigger>
          {creationMethod !== 'manual' && (
            <TabsTrigger value="generation">
              <Wand2 className="w-4 h-4 mr-2" />
              Generate
            </TabsTrigger>
          )}
          <TabsTrigger value="questions" disabled={creationMethod !== 'manual' && questions.length === 0}>
            Questions ({questions.length})
          </TabsTrigger>
          <TabsTrigger value="preview" disabled={!isReadyToSave}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metadata" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <AssessmentMetadataForm
                data={assessmentData}
                onChange={setAssessmentData}
                onNext={() => setCurrentTab(creationMethod !== 'manual' ? 'generation' : 'questions')}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {creationMethod !== 'manual' && (
          <TabsContent value="generation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Generation Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <AIGenerationForm
                  creationMethod={creationMethod}
                  assessmentData={assessmentData}
                  onGenerate={handleGenerateQuestions}
                  isGenerating={isGenerating}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="questions" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Questions</h3>
            <Button
              onClick={() => {
                const newQuestion: Question = {
                  id: Date.now().toString(),
                  type: 'multiple_choice',
                  question: '',
                  options: ['', '', '', ''],
                  correctAnswer: '',
                  explanation: '',
                  points: 1,
                  position: questions.length
                }
                setQuestions([...questions, newQuestion])
              }}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Question
            </Button>
          </div>

          <QuestionBuilder
            questions={questions}
            onChange={setQuestions}
            onNext={() => setCurrentTab('preview')}
          />
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <AssessmentPreview
                assessmentData={assessmentData}
                questions={questions}
              />
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button 
              onClick={onCancel}
              variant="outline"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveAssessment}
              disabled={!isReadyToSave || isSaving}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save as Draft'}
            </Button>
            <Button 
              onClick={handlePublishAssessment}
              disabled={!isReadyToSave || isSaving}
            >
              Save & Publish
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
