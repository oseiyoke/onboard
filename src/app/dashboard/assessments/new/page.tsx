'use client'

import { useState } from 'react'
import { ArrowLeft, Wand2, FileText, Youtube, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AssessmentBuilder } from '@/components/assessment/assessment-builder'
import Link from 'next/link'

type CreationMethod = 'manual' | 'content' | 'youtube' | 'prompt' | null

export default function NewAssessmentPage() {
  const [creationMethod, setCreationMethod] = useState<CreationMethod>(null)

  if (creationMethod) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setCreationMethod(null)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Method Selection
          </Button>
        </div>
        
        <AssessmentBuilder 
          creationMethod={creationMethod}
          onCancel={() => setCreationMethod(null)}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col items-center gap-6">
        <Link href="/dashboard/assessments" className="self-start">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Assessments
          </Button>
        </Link>
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Create New Assessment</h1>
          <p className="text-muted-foreground">
            Choose how you&apos;d like to create your assessment
          </p>
        </div>
      </div>

      {/* Creation Method Cards */}
      <div className="max-w-2xl mx-auto">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <div
            className="group cursor-pointer p-6 rounded-lg border bg-card hover:bg-primary/5 transition-colors"
            onClick={() => setCreationMethod('manual')}
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                <div className="text-lg">✏️</div>
              </div>
              <div>
                <h3 className="font-medium text-sm mb-1">Manual Creation</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Create questions manually with full control over content and format
                </p>
              </div>
            </div>
          </div>

          <div
            className="group cursor-pointer p-6 rounded-lg border bg-card hover:bg-emerald-50/50 transition-colors"
            onClick={() => setCreationMethod('content')}
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center group-hover:bg-emerald-200/70 transition-colors">
                <FileText className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-medium text-sm mb-1">From Existing Content</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Generate assessment from documents, videos, or files in your library
                </p>
              </div>
            </div>
          </div>

          <div
            className="group cursor-pointer p-6 rounded-lg border bg-card hover:bg-red-50/50 transition-colors"
            onClick={() => setCreationMethod('youtube')}
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center group-hover:bg-red-200/70 transition-colors">
                <Youtube className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-medium text-sm mb-1">From YouTube Video</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Paste a YouTube URL and generate assessment from the video content
                </p>
              </div>
            </div>
          </div>

          <div
            className="group cursor-pointer p-6 rounded-lg border bg-card hover:bg-blue-50/50 transition-colors"
            onClick={() => setCreationMethod('prompt')}
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200/70 transition-colors">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-sm mb-1">From Description</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Describe what you want to assess and let AI create the questions
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
