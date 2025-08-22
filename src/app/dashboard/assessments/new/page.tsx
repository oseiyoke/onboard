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
      <div className="flex items-center gap-4">
        <Link href="/dashboard/assessments">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Assessments
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Create New Assessment</h1>
          <p className="text-muted-foreground">
            Choose how you'd like to create your assessment
          </p>
        </div>
      </div>

      {/* Creation Method Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setCreationMethod('manual')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                ✏️
              </div>
              Manual Creation
            </CardTitle>
            <CardDescription>
              Create questions manually with full control over content and format
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>• Full control over questions and answers</div>
              <div>• Multiple question types available</div>
              <div>• Perfect for custom content</div>
            </div>
            <Button className="mt-4 w-full">Start Manual Creation</Button>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setCreationMethod('content')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              From Existing Content
            </CardTitle>
            <CardDescription>
              Generate assessment from documents, videos, or files in your content library
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>• Use PDFs, videos, documents</div>
              <div>• AI analyzes and creates questions</div>
              <div>• Review and edit before publishing</div>
            </div>
            <Button className="mt-4 w-full gap-2">
              <Wand2 className="w-4 h-4" />
              Generate from Content
            </Button>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setCreationMethod('youtube')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Youtube className="w-5 h-5" />
              </div>
              From YouTube Video
            </CardTitle>
            <CardDescription>
              Paste a YouTube URL and generate assessment from the video content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>• Extract transcript automatically</div>
              <div>• Generate relevant questions</div>
              <div>• Great for training videos</div>
            </div>
            <Button className="mt-4 w-full gap-2">
              <Wand2 className="w-4 h-4" />
              Generate from YouTube
            </Button>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setCreationMethod('prompt')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              From Description
            </CardTitle>
            <CardDescription>
              Describe what you want to assess and let AI create the questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>• Describe your topic or requirements</div>
              <div>• AI generates targeted questions</div>
              <div>• Quick and flexible approach</div>
            </div>
            <Button className="mt-4 w-full gap-2">
              <Wand2 className="w-4 h-4" />
              Generate from Prompt
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Info Section */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">💡 Pro Tips</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <div>• All AI-generated assessments can be reviewed and edited before publishing</div>
          <div>• You can always add or remove questions after generation</div>
          <div>• Preview your assessment before making it live</div>
          <div>• Use different question types to keep assessments engaging</div>
        </CardContent>
      </Card>
    </div>
  )
}
