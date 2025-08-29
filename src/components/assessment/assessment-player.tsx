'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight,
  Save,
  RotateCcw
} from 'lucide-react'

interface Question {
  id: string
  type: 'multiple_choice' | 'multi_select' | 'true_false' | 'short_answer' | 'essay'
  question: string
  options: string[]
  explanation?: string
  points: number
}

interface Assessment {
  id: string
  name: string
  description: string
  questions: Question[]
  passingScore: number
  retryLimit: number
  timeLimitSeconds?: number
  showFeedback: boolean
  showCorrectAnswers: boolean
}

type AnswerValue = string | string[] | boolean

interface AssessmentPlayerProps {
  assessment: Assessment
  attemptId: string
  onComplete: (answers: Record<string, AnswerValue>, timeSpent: number) => void
  onCancel?: () => void
}

export function AssessmentPlayer({ assessment, attemptId, onComplete, onCancel }: AssessmentPlayerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({})
  const [startTime] = useState(Date.now())
  const [timeLeft, setTimeLeft] = useState<number | null>(
    assessment.timeLimitSeconds ? assessment.timeLimitSeconds : null
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResults, setShowResults] = useState(false)

  // Timer effect
  useEffect(() => {
    if (!timeLeft) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev && prev <= 1) {
          // Time's up - auto-submit
          handleSubmit()
          return 0
        }
        return prev ? prev - 1 : null
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const questions = assessment.questions || []
  const currentQuestion = questions[currentQuestionIndex]
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const isFirstQuestion = currentQuestionIndex === 0

  // Handle case where there are no questions
  if (questions.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Assessment Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">This assessment has no questions configured.</p>
          <Button onClick={onCancel} className="mt-4">
            Return to Assessment
          </Button>
        </CardContent>
      </Card>
    )
  }

  const handleAnswerChange = (questionId: string, answer: AnswerValue) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    const timeSpent = Math.floor((Date.now() - startTime) / 1000)
    
    try {
      await onComplete(answers, timeSpent)
    } catch (error) {
      console.error('Submission failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const renderQuestionInput = (question: Question) => {
    const questionId = question.id
    const currentAnswer = answers[questionId]

    switch (question.type) {
      case 'multiple_choice':
        return (
          <RadioGroup
            value={currentAnswer || ''}
            onValueChange={(value) => handleAnswerChange(questionId, value)}
          >
            {question.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${questionId}-${index}`} />
                <Label htmlFor={`${questionId}-${index}`} className="flex-1">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )

      case 'multi_select':
        return (
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${questionId}-${index}`}
                  checked={(currentAnswer || []).includes(option)}
                  onCheckedChange={(checked) => {
                    const current = currentAnswer || []
                    const updated = checked
                      ? [...current, option]
                      : current.filter((a: string) => a !== option)
                    handleAnswerChange(questionId, updated)
                  }}
                />
                <Label htmlFor={`${questionId}-${index}`} className="flex-1">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        )

      case 'true_false':
        return (
          <RadioGroup
            value={currentAnswer?.toString() || ''}
            onValueChange={(value) => handleAnswerChange(questionId, value === 'true')}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id={`${questionId}-true`} />
              <Label htmlFor={`${questionId}-true`}>True</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id={`${questionId}-false`} />
              <Label htmlFor={`${questionId}-false`}>False</Label>
            </div>
          </RadioGroup>
        )

      case 'short_answer':
        return (
          <Input
            placeholder="Enter your answer..."
            value={currentAnswer || ''}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
          />
        )

      case 'essay':
        return (
          <Textarea
            placeholder="Enter your response..."
            value={currentAnswer || ''}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
            rows={6}
          />
        )

      default:
        return null
    }
  }

  const getAnsweredQuestions = () => {
    return questions.filter(q => 
      answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== ''
    ).length
  }

  if (showResults) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="text-center space-y-2">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
            <CardTitle>Assessment Submitted!</CardTitle>
            <p className="text-muted-foreground">
              Your responses have been recorded and will be graded.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              You will receive your results once the assessment has been reviewed.
            </p>
            <Button onClick={onCancel}>Return to Dashboard</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Assessment Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{assessment.name}</CardTitle>
              {assessment.description && (
                <p className="text-muted-foreground mt-1">{assessment.description}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              {timeLeft && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className={`font-mono ${timeLeft < 300 ? 'text-red-600' : ''}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
              )}
              <Badge variant="outline">
                {getAnsweredQuestions()} / {questions.length}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="w-full" />
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
        </CardContent>
      </Card>

      {/* Current Question */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg leading-relaxed">
              {currentQuestion.question}
            </CardTitle>
            <Badge variant="secondary" className="ml-4 shrink-0">
              {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderQuestionInput(currentQuestion)}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex gap-2">
              {onCancel && (
                <Button variant="outline" onClick={onCancel} className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Cancel
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isFirstQuestion}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>

              {!isLastQuestion ? (
                <Button onClick={handleNext} className="gap-2">
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Save className="w-4 h-4 animate-pulse" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Submit Assessment
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Question Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 gap-2">
            {questions.map((_, index) => (
              <Button
                key={index}
                variant={index === currentQuestionIndex ? "default" : "outline"}
                size="sm"
                className={`aspect-square p-0 ${
                  answers[questions[index].id] !== undefined ? 
                    'bg-green-100 border-green-300' : 
                    ''
                }`}
                onClick={() => setCurrentQuestionIndex(index)}
              >
                {index + 1}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Click any question number to jump to that question
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
