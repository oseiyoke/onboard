'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  Workflow, 
  Users, 
  Calendar,
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Flow } from '@/lib/services/flow.service'
import { toast } from 'sonner'

interface FlowsListProps {
  initialFlows: Flow[]
  pagination: {
    page: number
    limit: number
    total: number
  }
  searchParams: {
    search?: string
    page?: string
    active?: string
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function FlowsList({ initialFlows, pagination, searchParams }: FlowsListProps) {
  const router = useRouter()
  const currentSearchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchTerm, setSearchTerm] = useState(searchParams.search || '')
  
  // Calculate pagination info
  const totalPages = Math.ceil(pagination.total / pagination.limit)
  const hasNext = pagination.page < totalPages
  const hasPrev = pagination.page > 1

  // Handle search with debouncing
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    
    startTransition(() => {
      const params = new URLSearchParams(currentSearchParams)
      if (value) {
        params.set('search', value)
      } else {
        params.delete('search')
      }
      params.delete('page') // Reset to page 1 on search
      router.push(`/dashboard/flows?${params.toString()}`)
    })
  }

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    startTransition(() => {
      const params = new URLSearchParams(currentSearchParams)
      if (value === 'all') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      params.delete('page') // Reset to page 1 on filter
      router.push(`/dashboard/flows?${params.toString()}`)
    })
  }

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    startTransition(() => {
      const params = new URLSearchParams(currentSearchParams)
      params.set('page', newPage.toString())
      router.push(`/dashboard/flows?${params.toString()}`)
    })
  }

  // Handle flow actions with optimistic updates
  const handleDuplicateFlow = async (flowId: string) => {
    const loadingToast = toast.loading('Duplicating flow...')
    
    try {
      const response = await fetch(`/api/flows/${flowId}/duplicate`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to duplicate flow')
      }

      const { flow } = await response.json()
      toast.dismiss(loadingToast)
      toast.success('Flow duplicated successfully')
      
      // Navigate to edit the duplicated flow
      router.push(`/dashboard/flows/${flow.id}/edit`)
    } catch (error) {
      console.error('Error duplicating flow:', error)
      toast.dismiss(loadingToast)
      toast.error(error instanceof Error ? error.message : 'Failed to duplicate flow')
    }
  }

  const handleToggleActive = async (flowId: string, isActive: boolean) => {
    // Optimistic update
    const targetFlow = initialFlows.find(f => f.id === flowId)
    if (!targetFlow) return

    const newStatus = !isActive
    toast.success(newStatus ? 'Flow activated' : 'Flow deactivated')
    
    // Immediate refresh for optimistic update
    startTransition(() => {
      router.refresh()
    })

    try {
      const response = await fetch(`/api/flows/${flowId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: newStatus }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update flow')
      }

      // Refresh again to ensure consistency
      router.refresh()
    } catch (error) {
      console.error('Error updating flow:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update flow')
      // Refresh to revert optimistic update on error
      router.refresh()
    }
  }

  const handleDeleteFlow = async (flowId: string, flowName: string) => {
    if (!confirm(`Are you sure you want to delete "${flowName}"? This action cannot be undone.`)) {
      return
    }

    const loadingToast = toast.loading('Deleting flow...')

    try {
      const response = await fetch(`/api/flows/${flowId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete flow')
      }

      toast.dismiss(loadingToast)
      toast.success('Flow deleted successfully')
      
      startTransition(() => {
        router.push('/dashboard/flows')
        router.refresh()
      })
    } catch (error) {
      console.error('Error deleting flow:', error)
      toast.dismiss(loadingToast)
      toast.error(error instanceof Error ? error.message : 'Failed to delete flow')
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search flows..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
                disabled={isPending}
              />
            </div>
            
            <Select
              value={searchParams.active || 'all'}
              onValueChange={(value) => handleFilterChange('active', value)}
              disabled={isPending}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Flows</SelectItem>
                <SelectItem value="true">Active Only</SelectItem>
                <SelectItem value="false">Drafts Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Flows Grid */}
      {initialFlows.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Workflow className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchParams.search ? 'No flows found' : 'No flows created yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchParams.search 
                ? 'Try adjusting your search criteria'
                : 'Create your first onboarding flow to get started'
              }
            </p>
            {!searchParams.search && (
              <Button asChild>
                <Link href="/dashboard/flows/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Flow
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {initialFlows.map((flow) => {
              const nodeCount = (flow.flow_data as { nodes?: unknown[] })?.nodes?.length || 0
              
              return (
                <Link key={flow.id} href={`/dashboard/flows/${flow.id}`}>
                  <Card className="group hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-semibold truncate">
                            {flow.name}
                          </CardTitle>
                          {flow.description && (
                            <CardDescription className="mt-1 line-clamp-2">
                              {flow.description}
                            </CardDescription>
                          )}
                        </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="opacity-0 group-hover:opacity-100"
                            onClick={(e) => e.preventDefault()}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/flows/${flow.id}/edit`}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Flow
                            </Link>
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onSelect={() => handleDuplicateFlow(flow.id)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onSelect={() => handleToggleActive(flow.id, flow.is_active)}>
                            {flow.is_active ? (
                              <>
                                <Pause className="w-4 h-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleDeleteFlow(flow.id, flow.name)
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant={flow.is_active ? 'default' : 'secondary'}>
                          {flow.is_active ? 'Active' : 'Draft'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {nodeCount} phase{nodeCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(flow.created_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          0 participants
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2" onClick={(e) => e.preventDefault()}>
                        <Button asChild size="sm" className="flex-1">
                          <Link href={`/dashboard/flows/${flow.id}/edit`}>
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="flex-1">
                          <Link href={`/dashboard/flows/${flow.id}/preview`}>
                            <Play className="w-3 h-3 mr-1" />
                            Preview
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                </Link>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} flows
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!hasPrev || isPending}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    
                    <span className="text-sm text-muted-foreground">
                      Page {pagination.page} of {totalPages}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!hasNext || isPending}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
