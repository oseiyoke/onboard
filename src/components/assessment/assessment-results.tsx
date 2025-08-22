'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  BarChart3,
  Download,
  RefreshCw
} from 'lucide-react'

interface AttemptResult {
  id: string
  userId: string
  userName: string
  userEmail: string
  score: number
  maxScore: number
  percentageScore: number
  isPassed: boolean
  timeSpent: number
  answers: Record<string, any>
  startedAt: string
  completedAt?: string
}

interface QuestionResult {
  id: string
  question: string
  type: string
  correctAnswer: any
  userAnswer: any
  isCorrect: boolean
  points: number
  earnedPoints: number
}

interface AssessmentResultsProps {
  assessmentId: string
  assessmentName: string
  attempts: AttemptResult[]
  questions: any[]
  onRetakeAllow?: (attemptId: string) => void
}

export function AssessmentResults({ 
  assessmentId, 
  assessmentName, 
  attempts, 
  questions,
  onRetakeAllow 
}: AssessmentResultsProps) {
  const [selectedAttempt, setSelectedAttempt] = useState<AttemptResult | null>(
    attempts.length > 0 ? attempts[0] : null
  )

  // Calculate statistics
  const totalAttempts = attempts.length
  const passedAttempts = attempts.filter(a => a.isPassed).length
  const passRate = totalAttempts > 0 ? (passedAttempts / totalAttempts) * 100 : 0
  const averageScore = totalAttempts > 0 
    ? attempts.reduce((sum, a) => sum + a.percentageScore, 0) / totalAttempts 
    : 0
  const averageTime = totalAttempts > 0
    ? attempts.reduce((sum, a) => sum + a.timeSpent, 0) / totalAttempts
    : 0

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getQuestionResults = (attempt: AttemptResult): QuestionResult[] => {
    return questions.map(question => {
      const userAnswer = attempt.answers[question.id]
      const isCorrect = userAnswer === question.correct_answer || 
        (Array.isArray(question.correct_answer) && 
         Array.isArray(userAnswer) &&
         userAnswer.length === question.correct_answer.length &&
         userAnswer.every((ans: any) => question.correct_answer.includes(ans)))
      
      return {
        id: question.id,
        question: question.question,
        type: question.type,
        correctAnswer: question.correct_answer,
        userAnswer,
        isCorrect,
        points: question.points,
        earnedPoints: isCorrect ? question.points : 0
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold">{totalAttempts}</div>
              <div className="text-xs text-muted-foreground">Total Attempts</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-green-600">{Math.round(passRate)}%</div>
              <div className="text-xs text-muted-foreground">Pass Rate</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold">{Math.round(averageScore)}%</div>
              <div className="text-xs text-muted-foreground">Avg Score</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold">{formatTime(averageTime)}</div>
              <div className="text-xs text-muted-foreground">Avg Time</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="attempts" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="attempts">All Attempts</TabsTrigger>
            <TabsTrigger value="detailed" disabled={!selectedAttempt}>
              Detailed Review
            </TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export Results
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        <TabsContent value="attempts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Attempts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {attempts.map((attempt) => (
                  <div 
                    key={attempt.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedAttempt?.id === attempt.id ? 'bg-accent' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedAttempt(attempt)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-medium">{attempt.userName}</h4>
                          <p className="text-sm text-muted-foreground">{attempt.userEmail}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="font-semibold">
                            {Math.round(attempt.percentageScore)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {attempt.score}/{attempt.maxScore} pts
                          </div>
                        </div>
                        
                        <Badge variant={attempt.isPassed ? "default" : "destructive"}>
                          {attempt.isPassed ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Passed
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 mr-1" />
                              Failed
                            </>
                          )}
                        </Badge>
                        
                        <div className="text-right text-sm text-muted-foreground">
                          <div>{formatTime(attempt.timeSpent)}</div>
                          <div>{formatDate(attempt.completedAt || attempt.startedAt)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {attempts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2" />
                  <p>No attempts yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          {selectedAttempt && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Detailed Review - {selectedAttempt.userName}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={selectedAttempt.isPassed ? "default" : "destructive"}>
                        {selectedAttempt.percentageScore}% 
                        {selectedAttempt.isPassed ? ' Passed' : ' Failed'}
                      </Badge>
                      {!selectedAttempt.isPassed && onRetakeAllow && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onRetakeAllow(selectedAttempt.id)}
                        >
                          Allow Retake
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-lg font-semibold">{selectedAttempt.score}/{selectedAttempt.maxScore}</div>
                      <div className="text-sm text-muted-foreground">Points Earned</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">{formatTime(selectedAttempt.timeSpent)}</div>
                      <div className="text-sm text-muted-foreground">Time Spent</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">{formatDate(selectedAttempt.completedAt || selectedAttempt.startedAt)}</div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                  </div>

                  <Progress value={selectedAttempt.percentageScore} className="mb-6" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Question-by-Question Review</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getQuestionResults(selectedAttempt).map((result, index) => (
                      <div key={result.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-medium flex-1">
                            Q{index + 1}: {result.question}
                          </h4>
                          <div className="flex items-center gap-2 ml-4">
                            <Badge variant={result.isCorrect ? "default" : "destructive"} className="text-xs">
                              {result.earnedPoints}/{result.points} pts
                            </Badge>
                            {result.isCorrect ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-muted-foreground">Student Answer: </span>
                            <span className={result.isCorrect ? 'text-green-700' : 'text-red-700'}>
                              {Array.isArray(result.userAnswer) 
                                ? result.userAnswer.join(', ') 
                                : result.userAnswer?.toString() || 'No answer'}
                            </span>
                          </div>
                          
                          {!result.isCorrect && (
                            <div>
                              <span className="font-medium text-muted-foreground">Correct Answer: </span>
                              <span className="text-green-700">
                                {Array.isArray(result.correctAnswer) 
                                  ? result.correctAnswer.join(', ') 
                                  : result.correctAnswer?.toString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-4" />
                <p>Detailed analytics charts would be implemented here</p>
                <p className="text-sm mt-2">
                  This would include score distribution, question difficulty analysis, 
                  time trends, and more detailed insights.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
