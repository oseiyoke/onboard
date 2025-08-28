'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface UserData {
  id: string
  email: string
  role: 'admin' | 'participant'
  firstName: string | null
  lastName: string | null
  member: boolean
  createdAt: string
}

interface EnrollmentProgress {
  id: string
  status: string
  started_at: string
  completed_at: string | null
  flow: {
    id: string
    name: string
  }
  progress: {
    totalItems: number
    completedCount: number
    percentage: number
  }
}

interface UserDetailModalProps {
  user: UserData | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserDetailModal({ user, open, onOpenChange }: UserDetailModalProps) {
  const [enrollments, setEnrollments] = useState<EnrollmentProgress[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && user) {
      fetchUserProgress(user.id)
    }
  }, [open, user])

  const fetchUserProgress = async (userId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/users/${userId}/details`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user details')
      }

      const data = await response.json()
      setEnrollments(data.enrollments || [])
    } catch (error) {
      console.error('Error fetching user progress:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user.email
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Role:</span>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Member:</span>
                  <Badge variant={user.member ? 'default' : 'outline'}>
                    {user.member ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Joined:</span>
                  <span className="text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Flow Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </div>
              ) : enrollments.length === 0 ? (
                <p className="text-muted-foreground text-sm">No enrollments found.</p>
              ) : (
                <div className="space-y-4">
                  {enrollments.map((enrollment) => (
                    <div key={enrollment.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{enrollment.flow.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {enrollment.progress.completedCount} of {enrollment.progress.totalItems} items completed
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{enrollment.progress.percentage}%</div>
                          <Badge 
                            variant={enrollment.completed_at ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {enrollment.completed_at ? 'Completed' : 'In Progress'}
                          </Badge>
                        </div>
                      </div>
                      <Progress value={enrollment.progress.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
