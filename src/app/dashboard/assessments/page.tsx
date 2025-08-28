'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import Link from 'next/link'
import { apiAssessmentToUi } from '@/lib/utils/assessment-mapper'
import type { Assessment as ApiAssessment } from '@/lib/services/assessment.service'

interface Assessment {
  id: string
  name: string
  description: string
  questionCount: number
  passingScore: number
  attempts: number
  avgScore: number
  isPublished: boolean
  generationType: 'manual' | 'content'
  createdAt: string
  updatedAt: string
}

// Assessments will be loaded from the API

async function fetchAssessments(): Promise<Assessment[]> {
  try {
    const res = await fetch('/api/assessments?limit=100', {
      // Force next.js to always revalidate on client navigation
      cache: 'no-store',
    })

    if (!res.ok) {
      console.error('Failed to fetch assessments', await res.text())
      return []
    }

    const json = await res.json() as { data: ApiAssessment[] }
    // Convert API assessments to UI format
    return (json.data ?? []).map(apiAssessmentToUi)
  } catch (e) {
    console.error('Error while fetching assessments', e)
    return []
  }
}

export default function AssessmentsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedAssessment, setSelectedAssessment] = useState<string | null>(null)
  const [assessments, setAssessments] = useState<Assessment[]>([])

  useEffect(() => {
    // Fetch assessments on mount
    fetchAssessments().then(setAssessments)
  }, [])

  const filteredAssessments = assessments.filter(assessment =>
    assessment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (assessment.description ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  )



  const confirmDelete = () => {
    // Handle deletion
    console.log('Deleting assessment:', selectedAssessment)
    setDeleteDialogOpen(false)
    setSelectedAssessment(null)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Assessments</h1>
            <p className="text-muted-foreground">
              Create and manage assessments for your onboarding flows
            </p>
          </div>
          <Link href="/dashboard/assessments/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Assessment
            </Button>
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assessments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      {/* Assessment Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredAssessments.map((assessment) => (
          <Link key={assessment.id} href={`/dashboard/assessments/${assessment.id}/edit`}>
            <Card className="group hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base line-clamp-1">
                      {assessment.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {assessment.description}
                    </CardDescription>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap">
                    <Badge 
                      variant={assessment.isPublished ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {assessment.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {assessment.generationType === 'manual' ? 'Manual' : 'AI Generated'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {filteredAssessments.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                📝
              </div>
              <div>
                <h3 className="font-semibold">No assessments found</h3>
                <p className="text-muted-foreground text-sm">
                  {searchQuery ? 'Try adjusting your search criteria' : 'Create your first assessment to get started'}
                </p>
              </div>
              {!searchQuery && (
                <Link href="/dashboard/assessments/new">
                  <Button>Create Assessment</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Assessment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this assessment? This action cannot be undone.
              All associated questions and attempts will also be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Assessment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
