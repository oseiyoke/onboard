'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { AssessmentData } from '@/lib/utils/assessment-mapper'

interface AssessmentDetailsStepProps {
  data: AssessmentData
  onChange: (updates: Partial<AssessmentData>) => void
  errors?: Record<string, string>
}

export function AssessmentDetailsStep({ 
  data, 
  onChange, 
  errors = {} 
}: AssessmentDetailsStepProps) {
  const updateField = <K extends keyof AssessmentData>(field: K, value: AssessmentData[K]) => {
    onChange({ [field]: value })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Assessment Details</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Set up the basic information and settings for your assessment.
        </p>
      </div>
      
      <div className="space-y-6">
        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="name">Assessment Name *</Label>
            <Input
              id="name"
              value={data.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Enter assessment name"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={data.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Brief description of what this assessment covers..."
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="passing-score">Passing Score (%)</Label>
              <Input
                id="passing-score"
                type="number"
                min="0"
                max="100"
                value={data.passingScore}
                onChange={(e) => updateField('passingScore', parseInt(e.target.value) || 70)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="retry-limit">Maximum Attempts</Label>
              <Input
                id="retry-limit"
                type="number"
                min="1"
                value={data.retryLimit}
                onChange={(e) => updateField('retryLimit', parseInt(e.target.value) || 3)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="time-limit">Time Limit (optional)</Label>
            <Input
              id="time-limit"
              type="number"
              min="1"
              placeholder="Minutes"
              value={data.timeLimitSeconds ? Math.floor(data.timeLimitSeconds / 60) : ''}
              onChange={(e) => {
                const minutes = parseInt(e.target.value)
                updateField('timeLimitSeconds', minutes ? minutes * 60 : undefined)
              }}
            />
            <p className="text-xs text-muted-foreground">Leave empty for unlimited time</p>
          </div>
        </div>

        {/* Assessment Options */}
        <div className="bg-muted/50 rounded-lg p-6">
          <h3 className="font-semibold mb-4">Assessment Options</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Randomize Questions</div>
                <p className="text-xs text-muted-foreground">
                  Show questions in random order for each attempt
                </p>
              </div>
              <Switch
                checked={data.randomizeQuestions}
                onCheckedChange={(checked) => updateField('randomizeQuestions', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Randomize Answers</div>
                <p className="text-xs text-muted-foreground">
                  Shuffle answer options for multiple choice questions
                </p>
              </div>
              <Switch
                checked={data.randomizeAnswers}
                onCheckedChange={(checked) => updateField('randomizeAnswers', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Show Feedback</div>
                <p className="text-xs text-muted-foreground">
                  Display explanations for correct/incorrect answers
                </p>
              </div>
              <Switch
                checked={data.showFeedback}
                onCheckedChange={(checked) => updateField('showFeedback', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Show Correct Answers</div>
                <p className="text-xs text-muted-foreground">
                  Reveal correct answers after completion
                </p>
              </div>
              <Switch
                checked={data.showCorrectAnswers}
                onCheckedChange={(checked) => updateField('showCorrectAnswers', checked)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
