'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Edit, 
  Calendar,
  Clock,
  Users,
  FileText,
  ClipboardCheck,
  Info
} from 'lucide-react'
import { Flow } from '@/lib/services/flow.service'
import { StageWithItems } from '@/lib/services/stage.service'
import { FlowParticipantsList } from '@/components/flow/participants/flow-participants-list'

interface FlowViewClientProps {
  flow: Flow
  stages: StageWithItems[]
  userRole: 'admin' | 'participant'
}

export function FlowViewClient({ flow, stages, userRole }: FlowViewClientProps) {
  const [selectedStageId, setSelectedStageId] = useState<string | null>(stages && stages.length > 0 ? stages[0].id : null)

  const selectedStage = stages.find(stage => stage.id === selectedStageId)
  const isAdmin = userRole === 'admin'
  const totalItems = stages.reduce((acc, stage) => acc + (stage.items?.length || 0), 0)

  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case 'content': return FileText
      case 'assessment': return ClipboardCheck
      case 'info': return Info
      default: return FileText
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/flows">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Flows
                </Button>
              </Link>
              
              <div>
                <h1 className="text-2xl font-bold text-foreground">{flow.name}</h1>
                {flow.description && (
                  <p className="text-muted-foreground">{flow.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/dashboard/flows/${flow.id}/edit`}>
                <Button variant="outline" className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Flow
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className={`grid ${isAdmin ? 'grid-cols-3 max-w-lg' : 'grid-cols-2 max-w-md'} w-full`}>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="stages">Stages</TabsTrigger>
                {isAdmin && (
                  <TabsTrigger value="participants" className="gap-2">
                    <Users className="w-4 h-4" />
                    Dreamers
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <div className="grid gap-6">
                  {/* Flow Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/20">
                            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Stages</p>
                            <p className="text-2xl font-bold">{stages.length}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/20">
                            <ClipboardCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Learning Items</p>
                            <p className="text-2xl font-bold">{totalItems}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-primary/10 rounded-lg dark:bg-primary/20">
                            <Users className="h-6 w-6 text-primary dark:text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Status</p>
                            <Badge variant={flow.is_active ? "default" : "secondary"}>
                              {flow.is_active ? "Active" : "Draft"}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Flow Description */}
                  {flow.description && (
                    <Card>
                      <CardHeader>
                        <CardTitle>About This Flow</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground leading-relaxed">{flow.description}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="stages" className="mt-6">
                <div className="grid gap-4">
                  {stages.map((stage, index) => (
                    <Card 
                      key={stage.id}
                      className={`cursor-pointer transition-all ${
                        selectedStageId === stage.id 
                          ? 'ring-2 ring-primary border-primary' 
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setSelectedStageId(stage.id)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant="outline" className="text-xs">
                                Stage {index + 1}
                              </Badge>
                              <h3 className="text-lg font-semibold">{stage.title}</h3>
                            </div>
                            
                            {stage.description && (
                              <p className="text-muted-foreground mb-4">{stage.description}</p>
                            )}
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <FileText className="h-4 w-4" />
                                <span>{stage.items?.length || 0} items</span>
                              </div>
                            </div>
                          </div>
                          
                          {stage.image_url && (
                            <div className="ml-4 flex-shrink-0">
                              <img 
                                src={stage.image_url} 
                                alt={stage.title}
                                className="w-20 h-20 object-cover rounded-lg"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none'
                                }}
                              />
                            </div>
                          )}
                        </div>
                        
                        {stage.items && stage.items.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="flex flex-wrap gap-2">
                              {stage.items.map((item) => {
                                const ItemIcon = getItemTypeIcon(item.type)
                                return (
                                  <div
                                    key={item.id}
                                    className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-xs"
                                  >
                                    <ItemIcon className="h-3 w-3" />
                                    <span>{item.title}</span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {isAdmin && (
                <TabsContent value="participants" className="mt-6">
                  <FlowParticipantsList flowId={flow.id} />
                </TabsContent>
              )}
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              
              {/* Flow Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Flow Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Created</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(flow.created_at)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Last Updated</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(flow.updated_at)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Selected Stage Preview */}
              {selectedStage && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Stage Preview</CardTitle>
                    <CardDescription>{selectedStage.title}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedStage.description && (
                        <p className="text-sm text-muted-foreground">
                          {selectedStage.description}
                        </p>
                      )}
                      
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Items ({selectedStage.items?.length || 0})</h4>
                        {selectedStage.items && selectedStage.items.length > 0 ? (
                          <div className="space-y-2">
                            {selectedStage.items.slice(0, 3).map((item) => {
                              const ItemIcon = getItemTypeIcon(item.type)
                              return (
                                <div
                                  key={item.id}
                                  className="flex items-center gap-2 p-2 bg-muted rounded-lg text-xs"
                                >
                                  <ItemIcon className="h-3 w-3" />
                                  <span>{item.title}</span>
                                </div>
                              )
                            })}
                            {selectedStage.items.length > 3 && (
                              <p className="text-xs text-muted-foreground text-center">
                                +{selectedStage.items.length - 3} more items
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">No items</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
