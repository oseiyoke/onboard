'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Users, Shield, User, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { UserDetailModal } from '@/components/users/user-detail-modal'

interface UserData {
  id: string
  email: string
  role: 'admin' | 'participant'
  firstName: string | null
  lastName: string | null
  member: boolean
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function UsersPageClient() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const currentPage = parseInt(searchParams.get('page') ?? '1', 10) || 1

  useEffect(() => {
    fetchUsers(currentPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage])

  const fetchUsers = async (page: number) => {
    try {
      const response = await fetch(`/api/users?page=${page}&limit=25`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      setUsers(data.users)
      if (data.pagination) {
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const updateMemberStatus = async (userId: string, member: boolean) => {
    setUpdating(userId)
    try {
      const response = await fetch(`/api/users/${userId}/member`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ member }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update member status')
      }

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, member } : user
      ))

      toast.success(`Member status ${member ? 'granted' : 'revoked'} successfully`)
    } catch (error) {
      console.error('Error updating member status:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update member status')
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage user permissions and member access
          </p>
        </div>
        <div className="text-center py-8">Loading users...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage user permissions and member access
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Organization Users
          </CardTitle>
          <CardDescription>
            Grant or revoke content access for participants. Admins automatically have member access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    {user.role === 'admin' ? (
                      <Shield className="w-5 h-5 text-primary" />
                    ) : (
                      <User className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setSelectedUser(user)
                          setModalOpen(true)
                        }}
                        className="font-medium hover:underline text-left"
                      >
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}`
                          : user.email
                        }
                      </button>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                      {user.member && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Member
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`member-${user.id}`}
                      checked={user.member}
                      onCheckedChange={(checked) => updateMemberStatus(user.id, checked)}
                      disabled={user.role === 'admin' || updating === user.id}
                    />
                    <Label htmlFor={`member-${user.id}`} className="text-sm">
                      Content Access
                    </Label>
                  </div>
                  {updating === user.id && (
                    <div className="text-sm text-muted-foreground">Updating...</div>
                  )}
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No users found
              </div>
            )}
            {pagination && (
              <div className="flex justify-center items-center gap-4 pt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => router.push(`?page=${pagination.page - 1}`)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => router.push(`?page=${pagination.page + 1}`)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <UserDetailModal
        user={selectedUser}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  )
}
