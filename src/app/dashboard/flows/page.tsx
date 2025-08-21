'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  Pause
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Flow {
  id: string
  name: string
  description: string | null
  flow_data: Record<string, unknown>
  is_active: boolean
  created_at: string
  created_by: string
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export default function FlowsPage() {
  const { orgId } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  // Fetch flows from Supabase
  const { data: flows = [], isLoading } = useQuery({
    queryKey: ['flows', orgId],
    queryFn: async () => {
      if (!orgId) return []
      
      const { data, error } = await supabase
        .from('onboard_flows')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Flow[]
    },
    enabled: !!orgId,
  })

  // Filter flows based on search
  const filteredFlows = flows.filter(flow =>
    flow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (flow.description && flow.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Flow Builder</h1>
            <p className="text-muted-foreground">
              Create and manage your onboarding flows
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Flow Builder</h1>
          <p className="text-muted-foreground">
            Create and manage your onboarding flows
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/flows/new">
            <Plus className="w-4 h-4 mr-2" />
            Create Flow
          </Link>
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search flows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Flows Grid */}
      {filteredFlows.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Workflow className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchTerm ? 'No flows found' : 'No flows created yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? 'Try adjusting your search criteria'
                : 'Create your first onboarding flow to get started'
              }
            </p>
            {!searchTerm && (
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredFlows.map((flow) => {
            const nodeCount = (flow.flow_data as { nodes?: unknown[] })?.nodes?.length || 0
            
            return (
              <Card key={flow.id} className="group hover:shadow-md transition-shadow">
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
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
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
                        
                        <DropdownMenuItem>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem>
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
                        
                        <DropdownMenuItem className="text-red-600">
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
                        {flow.is_active ? 'Active' : 'Inactive'}
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
                    
                    <div className="flex gap-2 pt-2">
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
            )
          })}
        </div>
      )}
    </div>
  )
}
