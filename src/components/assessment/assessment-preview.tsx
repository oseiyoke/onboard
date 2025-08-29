'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Target, RotateCcw, Eye, EyeOff } from 'lucide-react'

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

type AnswerValue = string | string[] | boolean

interface Question {
  id: string
  type: 'multiple_choice' | 'multi_select' | 'true_false' | 'short_answer' | 'essay' | 'file_upload'
  question: string
  options: string[]
  correctAnswer: AnswerValue
  explanation: string
  points: number
  position: number
}

interface AssessmentPreviewProps {
  assessmentData: AssessmentData
  questions: Question[]
}

export function AssessmentPreview({ assessmentData, questions }: AssessmentPreviewProps) {
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)

  const getQuestionTypeLabel = (type: string) => {
    const labels = {
      multiple_choice: 'Multiple Choice',
      multi_select: 'Multiple Select',
      true_false: 'True/False',
      short_answer: 'Short Answer',
      essay: 'Essay'
    }
    return labels[type as keyof typeof labels] || type
  }

  const renderQuestionPreview = (question: Question, index: number) => {
    return (
      <Card key={question.id}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Question {index + 1}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {getQuestionTypeLabel(question.type)}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {question.points} {question.points === 1 ? 'point' : 'points'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <p className="font-medium">{question.question}</p>
            
            {(question.type === 'multiple_choice' || question.type === 'multi_select') && (
              <div className="space-y-2 ml-4">
                {question.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center gap-2">
                    <div className="w-4 h-4 border rounded-sm bg-muted" />
                    <span className="text-sm">{option}</span>
                    {/* Show correct answers in preview */}
                    {((question.type === 'multiple_choice' && option === question.correctAnswer) ||
                      (question.type === 'multi_select' && Array.isArray(question.correctAnswer) && question.correctAnswer.includes(option))) && (
                      <Badge variant="default" className="text-xs ml-2">Correct</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {question.type === 'true_false' && (
              <div className="space-y-2 ml-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border rounded-sm bg-muted" />
                  <span className="text-sm">True</span>
                  {question.correctAnswer === true && (
                    <Badge variant="default" className="text-xs ml-2">Correct</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border rounded-sm bg-muted" />
                  <span className="text-sm">False</span>
                  {question.correctAnswer === false && (
                    <Badge variant="default" className="text-xs ml-2">Correct</Badge>
                  )}
                </div>
              </div>
            )}
            
            {question.type === 'short_answer' && (
              <div className="ml-4">
                <div className="border rounded p-2 bg-muted text-sm text-muted-foreground">
                  Expected answer: {question.correctAnswer}
                </div>
              </div>
            )}
            
            {question.type === 'essay' && (
              <div className="ml-4">
                <div className="border rounded p-2 bg-muted text-sm text-muted-foreground h-20">
                  Essay answer area (manual grading required)
                </div>
              </div>
            )}
            
            {question.explanation && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm font-medium text-blue-900 mb-1">Explanation:</p>
                <p className="text-sm text-blue-800">{question.explanation}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Assessment Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Assessment Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{assessmentData.name}</h3>
              {assessmentData.description && (
                <p className="text-muted-foreground mt-1">{assessmentData.description}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{questions.length}</div>
                <div className="text-xs text-muted-foreground">Questions</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{totalPoints}</div>
                <div className="text-xs text-muted-foreground">Total Points</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{assessmentData.passingScore}%</div>
                <div className="text-xs text-muted-foreground">Passing Score</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{assessmentData.retryLimit}</div>
                <div className="text-xs text-muted-foreground">Max Attempts</div>
              </div>
            </div>
            
            {/* Assessment Settings */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Settings</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  {assessmentData.timeLimitSeconds ? (
                    <>
                      <Clock className="w-4 h-4 text-green-600" />
                      <span>Time limit: {Math.floor(assessmentData.timeLimitSeconds / 60)} minutes</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">No time limit</span>
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <RotateCcw className={`w-4 h-4 ${assessmentData.randomizeQuestions ? 'text-green-600' : 'text-muted-foreground'}`} />
                  <span className={assessmentData.randomizeQuestions ? '' : 'text-muted-foreground'}>
                    {assessmentData.randomizeQuestions ? 'Questions randomized' : 'Questions in order'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Target className={`w-4 h-4 ${assessmentData.randomizeAnswers ? 'text-green-600' : 'text-muted-foreground'}`} />
                  <span className={assessmentData.randomizeAnswers ? '' : 'text-muted-foreground'}>
                    {assessmentData.randomizeAnswers ? 'Answers shuffled' : 'Answers in order'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {assessmentData.showFeedback ? (
                    <>
                      <Eye className="w-4 h-4 text-green-600" />
                      <span>Feedback shown</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">No feedback shown</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Preview */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Questions Preview</h3>
        {questions.map((question, index) => renderQuestionPreview(question, index))}
      </div>

      {/* Summary */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <h4 className="font-semibold">Assessment Ready!</h4>
            <p className="text-sm text-muted-foreground">
              Your assessment contains {questions.length} questions worth {totalPoints} total points.
              Participants need to score {assessmentData.passingScore}% or higher to pass.
            </p>
            <div className="flex justify-center gap-2 mt-4">
              <Badge variant="outline">
                {questions.filter(q => q.type === 'multiple_choice').length} Multiple Choice
              </Badge>
              <Badge variant="outline">
                {questions.filter(q => q.type === 'true_false').length} True/False
              </Badge>
              {questions.filter(q => q.type === 'multi_select').length > 0 && (
                <Badge variant="outline">
                  {questions.filter(q => q.type === 'multi_select').length} Multi Select
                </Badge>
              )}
              {questions.filter(q => q.type === 'short_answer').length > 0 && (
                <Badge variant="outline">
                  {questions.filter(q => q.type === 'short_answer').length} Short Answer
                </Badge>
              )}
              {questions.filter(q => q.type === 'essay').length > 0 && (
                <Badge variant="outline">
                  {questions.filter(q => q.type === 'essay').length} Essay
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
