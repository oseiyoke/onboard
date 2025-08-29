'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Link, 
  Youtube, 
  FileText, 
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertCircle,
  Globe
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface LinkUploadProps {
  onUploadComplete?: (content: MetadataResponse) => void
}

interface MetadataResponse {
  title: string
  thumbnail?: string
  type: 'video' | 'document' | 'other'
  source: 'youtube' | 'gdrive' | 'external'
  external_url: string
  suggested_name: string
}

const getSourceIcon = (source: string) => {
  switch (source) {
    case 'youtube': return Youtube
    case 'gdrive': return FileText
    default: return Globe
  }
}

const getSourceColor = (source: string) => {
  switch (source) {
    case 'youtube': return 'bg-red-100 text-red-800'
    case 'gdrive': return 'bg-blue-100 text-blue-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

const detectUrlType = (url: string): 'youtube' | 'gdrive' | 'external' => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube'
  }
  if (url.includes('drive.google.com')) {
    return 'gdrive'
  }
  return 'external'
}

export function LinkUpload({ onUploadComplete }: LinkUploadProps) {
  const [url, setUrl] = useState('')
  const [metadata, setMetadata] = useState<MetadataResponse | null>(null)
  const [customName, setCustomName] = useState('')
  const [step, setStep] = useState<'input' | 'preview' | 'success'>('input')
  const queryClient = useQueryClient()

  // Fetch metadata mutation
  const fetchMetadataMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await fetch('/api/metadata/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch metadata')
      }

      return response.json() as Promise<MetadataResponse>
    },
    onSuccess: (data) => {
      setMetadata(data)
      setCustomName(data.suggested_name)
      setStep('preview')
    },
  })

  // Create content mutation
  const createContentMutation = useMutation({
    mutationFn: async (data: {
      name: string
      type: string
      source: string
      external_url: string
      thumbnail_url?: string
    }) => {
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create content')
      }

      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['content'], exact: false })
      setStep('success')
      if (onUploadComplete) {
        onUploadComplete(data.content)
      }
    },
  })

  const handleFetchMetadata = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidUrl(url)) return
    fetchMetadataMutation.mutate(url)
  }

  const handleCreateContent = async () => {
    if (!metadata) return

    createContentMutation.mutate({
      name: customName,
      type: metadata.type,
      source: metadata.source,
      external_url: metadata.external_url,
      thumbnail_url: metadata.thumbnail,
    })
  }

  const handleReset = () => {
    setUrl('')
    setMetadata(null)
    setCustomName('')
    setStep('input')
  }

  const urlType = url ? detectUrlType(url) : null
  const SourceIcon = urlType ? getSourceIcon(urlType) : Link

  if (step === 'success') {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">Link Added Successfully!</h3>
          <p className="text-muted-foreground mb-4">
            Your content has been added to the library.
          </p>
          <Button onClick={handleReset} variant="outline">
            Add Another Link
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (step === 'preview' && metadata) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SourceIcon className="w-5 h-5" />
            Preview Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preview Card */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="flex items-start gap-3">
              {metadata.thumbnail && (
                <img
                  src={metadata.thumbnail}
                  alt="Thumbnail"
                  className="w-16 h-12 object-cover rounded flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className={getSourceColor(metadata.source)}>
                    {metadata.source.toUpperCase()}
                  </Badge>
                  <Badge variant="outline">
                    {metadata.type.toUpperCase()}
                  </Badge>
                </div>
                <h3 className="font-medium text-sm mb-1 truncate">
                  {metadata.title}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {metadata.external_url}
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <a href={metadata.external_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Custom Name Input */}
          <div className="space-y-2">
            <Label htmlFor="custom-name">Content Name</Label>
            <Input
              id="custom-name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Enter a custom name for this content"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleReset}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateContent}
              disabled={!customName.trim() || createContentMutation.isPending}
            >
              {createContentMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Add to Library
            </Button>
          </div>

          {createContentMutation.isError && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" />
              {createContentMutation.error?.message || 'Failed to add content'}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="w-5 h-5" />
          Add External Link
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFetchMetadata} className="space-y-4">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <div className="relative">
              <SourceIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=... or https://drive.google.com/..."
                className="pl-10"
                required
              />
            </div>
            {url && !isValidUrl(url) && (
              <p className="text-sm text-red-600">Please enter a valid URL</p>
            )}
          </div>

          {/* URL Type Badge */}
          {urlType && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={getSourceColor(urlType)}>
                {urlType === 'youtube' && 'YouTube Video'}
                {urlType === 'gdrive' && 'Google Drive'}
                {urlType === 'external' && 'External Link'}
              </Badge>
            </div>
          )}

          {/* Supported Sources */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Supported Sources:</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline" className="gap-1">
                <Youtube className="w-3 h-3" />
                YouTube
              </Badge>
              <Badge variant="outline" className="gap-1">
                <FileText className="w-3 h-3" />
                Google Drive
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Globe className="w-3 h-3" />
                External Links
              </Badge>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={!url || !isValidUrl(url) || fetchMetadataMutation.isPending}
            className="w-full"
          >
            {fetchMetadataMutation.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Fetch Content Info
          </Button>

          {fetchMetadataMutation.isError && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" />
              {fetchMetadataMutation.error?.message || 'Failed to fetch content info'}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
