'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Users, 
  Clock, 
  CheckCircle, 
  User,
  Calendar,
  BarChart3,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { useFlowParticipants } from '@/hooks/use-flow-participants'
import { FlowParticipant } from '@/lib/services/flow-participants.service'

interface FlowParticipantsListProps {
  flowId: string
}

function ParticipantsTable({ participants }: { participants: FlowParticipant[] }) {
  const getStatusBadge = (participant: FlowParticipant) => {
    if (participant.completed_at) {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        Completed
      </Badge>
    }
    if (participant.progress.percentage > 0) {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        <Clock className="w-3 h-3 mr-1" />
        In Progress
      </Badge>
    }
    return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
      <User className="w-3 h-3 mr-1" />
      Not Started
    </Badge>
  }

  const getDisplayName = (user: FlowParticipant['user']) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim()
    }
    return user.email
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Participant</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Current Stage</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Completed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {participants.map((participant) => (
            <TableRow key={participant.id} className="hover:bg-muted/50">
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium">{getDisplayName(participant.user)}</div>
                    <div className="text-sm text-muted-foreground truncate">{participant.user.email}</div>
                    {participant.user.member && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        Member
                      </Badge>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {getStatusBadge(participant)}
              </TableCell>
              <TableCell>
                <div className="space-y-2 min-w-[120px]">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{participant.progress.percentage}%</span>
                  </div>
                  <Progress value={participant.progress.percentage} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {participant.progress.completedCount} of {participant.progress.totalItems} items
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {participant.progress.currentStage ? (
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{participant.progress.currentStage.title}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{formatDate(participant.started_at)}</span>
                </div>
              </TableCell>
              <TableCell>
                {participant.completed_at ? (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>{formatDate(participant.completed_at)}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Participant</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Current Stage</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Completed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(6)].map((_, i) => (
            <TableRow key={i} className="animate-pulse">
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded-full" />
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-32" />
                    <div className="h-3 bg-muted rounded w-40" />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="h-6 w-20 bg-muted rounded" />
              </TableCell>
              <TableCell>
                <div className="space-y-2 min-w-[120px]">
                  <div className="h-3 w-8 bg-muted rounded" />
                  <div className="h-2 bg-muted rounded w-full" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
              </TableCell>
              <TableCell>
                <div className="h-4 bg-muted rounded w-32" />
              </TableCell>
              <TableCell>
                <div className="h-4 bg-muted rounded w-20" />
              </TableCell>
              <TableCell>
                <div className="h-4 bg-muted rounded w-20" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function EmptyState() {
  return (
    <Card className="text-center py-12">
      <CardContent className="space-y-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
          <Users className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">No Participants Yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            This flow doesn&apos;t have any enrolled participants yet. 
            Participants will appear here once they&apos;re enrolled.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <Card className="text-center py-12">
      <CardContent className="space-y-4">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Failed to Load Participants</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {error.message}
          </p>
        </div>
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      </CardContent>
    </Card>
  )
}

export function FlowParticipantsList({ flowId }: FlowParticipantsListProps) {
  const { participants, loading, error, refreshParticipants } = useFlowParticipants(flowId)

  if (loading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return <ErrorState error={error} onRetry={refreshParticipants} />
  }

  if (!participants || participants.length === 0) {
    return <EmptyState />
  }

  // Separate participants by status
  const inProgressParticipants = participants.filter(p => !p.completed_at && p.progress.percentage > 0)
  const completedParticipants = participants.filter(p => p.completed_at)

  const totalParticipants = participants.length
  const averageProgress = Math.round(
    participants.reduce((acc, p) => acc + p.progress.percentage, 0) / totalParticipants
  )

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Participants</p>
                <p className="text-2xl font-bold">{totalParticipants}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/20">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedParticipants.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/20">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{inProgressParticipants.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900/20">
                <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Progress</p>
                <p className="text-2xl font-bold">{averageProgress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Participants Table */}
      <div className="space-y-6">
        {/* All Participants in Single Table */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: 'hsl(262, 83%, 58%)' }}>
            <Users className="w-5 h-5" />
            All Participants ({totalParticipants})
          </h2>
          <ParticipantsTable participants={participants} />
        </div>
      </div>
    </div>
  )
}
