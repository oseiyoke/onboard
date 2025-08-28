'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Eye, Filter } from 'lucide-react'
import type { AssessmentAttemptWithUser } from '@/lib/services/assessment.service'

interface AssessmentAttemptsProps {
  assessmentId: string
  assessmentName: string
}

interface AttemptStats {
  totalAttempts: number
  passedAttempts: number
  failedAttempts: number
  passRate: number
  averageScore: number
  averageTime: number
}

interface AttemptDetailsProps {
  attempt: AssessmentAttemptWithUser
  questions: Question[]
}

interface Question {
  id: string
  question: string
  type: string
  correct_answer: unknown
  points: number
}

function AttemptDetails({ attempt, questions }: AttemptDetailsProps) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
  }



  const getQuestionResults = () => {
    return questions.map(question => {
      const userAnswer = attempt.answers[question.id]
      let isCorrect = false
      
      // Check if answer is correct based on question type
      switch (question.type) {
        case 'multiple_choice':
        case 'true_false':
        case 'short_answer':
          isCorrect = userAnswer === question.correct_answer
          break
        case 'multi_select':
          if (Array.isArray(question.correct_answer) && Array.isArray(userAnswer)) {
            isCorrect = userAnswer.length === question.correct_answer.length &&
                       userAnswer.every((ans: unknown) => (question.correct_answer as unknown[]).includes(ans))
          }
          break
        default:
          isCorrect = false
      }
      
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

  const questionResults = getQuestionResults()
  const totalPoints = questionResults.reduce((sum, q) => sum + q.points, 0)
  const earnedPoints = questionResults.reduce((sum, q) => sum + q.earnedPoints, 0)

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Attempt Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold text-violet-600">
            {attempt.score?.toFixed(1) || 0}%
          </div>
          <div className="text-sm text-muted-foreground">Final Score</div>
        </div>
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold">
            {earnedPoints}/{totalPoints}
          </div>
          <div className="text-sm text-muted-foreground">Points</div>
        </div>
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold">
            {formatTime(attempt.time_spent_seconds)}
          </div>
          <div className="text-sm text-muted-foreground">Time Spent</div>
        </div>
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <Badge variant={attempt.is_passed ? 'default' : 'destructive'} className="text-sm">
            {attempt.is_passed ? 'Passed' : 'Failed'}
          </Badge>
        </div>
      </div>

      {/* Question Breakdown */}
      <div>
        <h4 className="font-semibold mb-4">Question Breakdown</h4>
        <div className="space-y-4">
          {questionResults.map((result, index) => (
            <Card key={result.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <span className="font-medium">Question {index + 1}</span>
                <Badge variant={result.isCorrect ? 'default' : 'destructive'}>
                  {result.earnedPoints}/{result.points} pts
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{result.question}</p>
              <div className="grid gap-2 text-sm">
                <div>
                  <span className="font-medium">User Answer: </span>
                  <span className={result.isCorrect ? 'text-green-600' : 'text-red-600'}>
                    {Array.isArray(result.userAnswer) 
                      ? result.userAnswer.join(', ') 
                      : result.userAnswer?.toString() || 'No answer'
                    }
                  </span>
                </div>
                <div>
                  <span className="font-medium">Correct Answer: </span>
                  <span className="text-green-600">
                    {Array.isArray(result.correctAnswer) 
                      ? result.correctAnswer.join(', ') 
                      : result.correctAnswer?.toString()
                    }
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export function AssessmentAttempts({ assessmentId, assessmentName }: AssessmentAttemptsProps) {
  const [attempts, setAttempts] = useState<AssessmentAttemptWithUser[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<AttemptStats | null>(null)
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchAttempts = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })
      
      if (filter !== 'all') {
        params.append('passed', filter === 'passed' ? 'true' : 'false')
      }

      const [attemptsResponse, assessmentResponse] = await Promise.all([
        fetch(`/api/assessments/${assessmentId}/admin/attempts?${params}`),
        fetch(`/api/assessments/${assessmentId}?includeQuestions=true`)
      ])

      if (!attemptsResponse.ok || !assessmentResponse.ok) {
        throw new Error('Failed to fetch data')
      }

      const attemptsData = await attemptsResponse.json()
      const assessmentData = await assessmentResponse.json()
      
      setAttempts(attemptsData.data)
      setQuestions(assessmentData.assessment.questions || [])
      setTotalPages(Math.ceil(attemptsData.pagination.total / 50))

      // Calculate stats
      const totalAttempts = attemptsData.pagination.total
      const passedAttempts = attemptsData.data.filter((a: AssessmentAttemptWithUser) => a.is_passed).length
      const failedAttempts = totalAttempts - passedAttempts
      const passRate = totalAttempts > 0 ? (passedAttempts / totalAttempts) * 100 : 0
      const averageScore = attemptsData.data.length > 0 
        ? attemptsData.data.reduce((sum: number, a: AssessmentAttemptWithUser) => sum + (a.score || 0), 0) / attemptsData.data.length
        : 0
      const averageTime = attemptsData.data.length > 0
        ? attemptsData.data.reduce((sum: number, a: AssessmentAttemptWithUser) => sum + a.time_spent_seconds, 0) / attemptsData.data.length
        : 0

      setStats({
        totalAttempts,
        passedAttempts,
        failedAttempts,
        passRate,
        averageScore,
        averageTime
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch attempts')
    } finally {
      setLoading(false)
    }
  }, [assessmentId, filter, page])

  useEffect(() => {
    fetchAttempts()
  }, [assessmentId, filter, page, fetchAttempts])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading && !attempts.length) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-red-600">Error: {error}</p>
              <Button onClick={fetchAttempts} className="mt-4">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-violet-600">{stats.totalAttempts}</div>
              <div className="text-sm text-muted-foreground">Total Attempts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.passedAttempts}</div>
              <div className="text-sm text-muted-foreground">Passed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.failedAttempts}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.passRate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Pass Rate</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.averageScore.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Avg Score</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Attempts Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Assessment Attempts</CardTitle>
              <CardDescription>
                View all attempts for &quot;{assessmentName}&quot;
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filter} onValueChange={(value) => setFilter(value as 'all' | 'passed' | 'failed')}>
                <SelectTrigger className="w-32">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {attempts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No attempts found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time Spent</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.map((attempt) => (
                  <TableRow key={attempt.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{attempt.user.name}</div>
                        <div className="text-sm text-muted-foreground">{attempt.user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {attempt.score?.toFixed(1) || 0}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={attempt.is_passed ? 'default' : 'destructive'}>
                        {attempt.is_passed ? 'Passed' : 'Failed'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatTime(attempt.time_spent_seconds)}</TableCell>
                    <TableCell>
                      {attempt.completed_at ? formatDate(attempt.completed_at) : 'In Progress'}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Attempt Details</DialogTitle>
                            <DialogDescription>
                              {attempt.user.name} - {formatDate(attempt.completed_at || attempt.started_at)}
                            </DialogDescription>
                          </DialogHeader>
                          <AttemptDetails attempt={attempt} questions={questions} />
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
