'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight } from 'lucide-react'

interface AssessmentData {
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

interface AssessmentMetadataFormProps {
  data: AssessmentData
  onChange: (data: AssessmentData) => void
  onNext: () => void
}

export function AssessmentMetadataForm({ data, onChange, onNext }: AssessmentMetadataFormProps) {
  const handleChange = (field: keyof AssessmentData, value: any) => {
    onChange({ ...data, [field]: value })
  }

  const isValid = data.name.trim().length > 0

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="name">Assessment Name *</Label>
          <Input
            id="name"
            placeholder="e.g., Company Culture & Values"
            value={data.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Brief description of what this assessment covers..."
            value={data.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="passing-score">Passing Score (%)</Label>
            <Input
              id="passing-score"
              type="number"
              min="1"
              max="100"
              value={data.passingScore}
              onChange={(e) => handleChange('passingScore', parseInt(e.target.value) || 70)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="retry-limit">Maximum Attempts</Label>
            <Input
              id="retry-limit"
              type="number"
              min="1"
              max="10"
              value={data.retryLimit}
              onChange={(e) => handleChange('retryLimit', parseInt(e.target.value) || 3)}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="time-limit">Time Limit (optional)</Label>
          <div className="flex gap-2 items-center">
            <Input
              id="time-limit"
              type="number"
              min="1"
              placeholder="Minutes"
              value={data.timeLimitSeconds ? Math.floor(data.timeLimitSeconds / 60) : ''}
              onChange={(e) => {
                const minutes = parseInt(e.target.value) || 0
                handleChange('timeLimitSeconds', minutes > 0 ? minutes * 60 : undefined)
              }}
            />
            <span className="text-sm text-muted-foreground">minutes</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Leave empty for unlimited time
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-4">Assessment Options</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="randomize-questions">Randomize Questions</Label>
                <p className="text-xs text-muted-foreground">
                  Show questions in random order for each attempt
                </p>
              </div>
              <Switch
                id="randomize-questions"
                checked={data.randomizeQuestions}
                onCheckedChange={(checked) => handleChange('randomizeQuestions', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="randomize-answers">Randomize Answers</Label>
                <p className="text-xs text-muted-foreground">
                  Shuffle answer options for multiple choice questions
                </p>
              </div>
              <Switch
                id="randomize-answers"
                checked={data.randomizeAnswers}
                onCheckedChange={(checked) => handleChange('randomizeAnswers', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show-feedback">Show Feedback</Label>
                <p className="text-xs text-muted-foreground">
                  Display explanations for correct/incorrect answers
                </p>
              </div>
              <Switch
                id="show-feedback"
                checked={data.showFeedback}
                onCheckedChange={(checked) => handleChange('showFeedback', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show-correct-answers">Show Correct Answers</Label>
                <p className="text-xs text-muted-foreground">
                  Reveal correct answers after completion
                </p>
              </div>
              <Switch
                id="show-correct-answers"
                checked={data.showCorrectAnswers}
                onCheckedChange={(checked) => handleChange('showCorrectAnswers', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={onNext}
          disabled={!isValid}
          className="gap-2"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
