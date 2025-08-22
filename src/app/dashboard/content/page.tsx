'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileUpload } from '@/components/content/file-upload'
import { ContentLibrary } from '@/components/content/content-library'
import { LinkUpload } from '@/components/content/link-upload'
import { Plus, Upload, Library, Link } from 'lucide-react'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState('library')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Library</h1>
          <p className="text-muted-foreground">
            Manage your onboarding content and resources
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="library" className="gap-2">
            <Library className="w-4 h-4" />
            Library
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="w-4 h-4" />
            Upload Files
          </TabsTrigger>
          <TabsTrigger value="links" className="gap-2">
            <Link className="w-4 h-4" />
            Add Links
          </TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="mt-6">
          <ContentLibrary />
        </TabsContent>

        <TabsContent value="upload" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Files
              </CardTitle>
              <CardDescription>
                Upload files directly to your content library. Supported formats include PDFs, videos, images, and documents.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload 
                onUploadComplete={(files) => {
                  console.log('Upload completed:', files)
                  // Switch back to library tab to show uploaded files
                  setActiveTab('library')
                }}
                maxFiles={10}
                maxSize={50 * 1024 * 1024} // 50MB
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links" className="mt-6">
          <LinkUpload 
            onUploadComplete={(content) => {
              console.log('Link added:', content)
              // Switch back to library tab to show added content
              setActiveTab('library')
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
