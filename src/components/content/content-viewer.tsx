'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, ExternalLink, ZoomIn, ZoomOut } from 'lucide-react'

interface ContentItem {
  id: string
  org_id: string
  name: string
  type: 'pdf' | 'video' | 'document' | 'image' | 'other'
  source: 'upload' | 'youtube' | 'gdrive' | 'external'
  file_url?: string
  external_url?: string
  file_size?: number
  thumbnail_url?: string
  duration?: number
  version: number
  view_count: number
  metadata: Record<string, unknown>
  created_at: string
  created_by: string
}

interface ContentViewerProps {
  content: ContentItem
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Extract YouTube video ID from various YouTube URL formats
function extractYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

export function ContentViewer({ content }: ContentViewerProps) {
  const [zoom, setZoom] = useState(100)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)

  // Fetch signed URL for uploaded content
  useEffect(() => {
    async function fetchSigned() {
      if (content.source === 'upload') {
        try {
          const res = await fetch(`/api/content/${content.id}/download`)
          if (res.ok) {
            const { downloadUrl } = await res.json()
            setSignedUrl(downloadUrl)
          }
        } catch (e) {
          console.error('Failed to fetch signed URL', e)
        }
      }
    }
    fetchSigned()
  }, [content])

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50))

  const renderContent = () => {
    const contentUrl = content.source === 'upload' ? signedUrl : content.external_url

    // Handle YouTube content
    if (content.source === 'youtube' && content.external_url) {
      const videoId = extractYouTubeId(content.external_url)
      if (videoId) {
        return (
          <div className="bg-black rounded-lg overflow-hidden">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              className="w-full h-[60vh]"
              title={content.name}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        )
      }
    }

    // Handle Google Drive content
    if (content.source === 'gdrive' && content.external_url) {
      return (
        <div className="bg-muted/50 rounded-lg p-8 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-2xl">📁</span>
            </div>
            <div>
              <h3 className="font-medium mb-2">{content.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Google Drive content opens in a new tab for full functionality.
              </p>
              <Button asChild>
                <a href={content.external_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in Google Drive
                </a>
              </Button>
            </div>
          </div>
        </div>
      )
    }

    // Handle external links
    if (content.source === 'external' && content.external_url) {
      return (
        <div className="bg-muted/50 rounded-lg p-8 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-2xl">🌐</span>
            </div>
            <div>
              <h3 className="font-medium mb-2">{content.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                External content
              </p>
              <p className="text-xs text-muted-foreground mb-4 break-all">
                {content.external_url}
              </p>
              <Button asChild>
                <a href={content.external_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Link
                </a>
              </Button>
            </div>
          </div>
        </div>
      )
    }

    // Handle uploaded content
    if (!contentUrl) {
      return (
        <div className="bg-muted/50 rounded-lg p-8 text-center">
          <p className="text-muted-foreground">Content not available.</p>
        </div>
      )
    }

    switch (content.type) {
      case 'image':
        return (
          <div className="flex items-center justify-center bg-muted/50 rounded-lg p-4">
            <img
              src={contentUrl}
              alt={content.name}
              className="max-w-full max-h-[60vh] object-contain rounded"
              style={{ transform: `scale(${zoom / 100})` }}
            />
          </div>
        )

      case 'video':
        return (
          <div className="bg-black rounded-lg overflow-hidden">
            <video
              controls
              className="w-full max-h-[60vh]"
              style={{ transform: `scale(${zoom / 100})` }}
            >
              <source src={contentUrl} type="video/mp4" />
              <source src={contentUrl} type="video/webm" />
              <source src={contentUrl} type="video/quicktime" />
              Your browser does not support the video tag.
            </video>
          </div>
        )

      case 'pdf':
        return (
          <div className="bg-muted/50 rounded-lg p-4">
            <iframe
              src={`${contentUrl}#toolbar=1&navpanes=1&scrollbar=1`}
              className="w-full h-[60vh] border-0 rounded"
              title={content.name}
              style={{ transform: `scale(${zoom / 100})` }}
            />
          </div>
        )

      case 'document':
        return (
          <div className="bg-muted/50 rounded-lg p-8 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-2xl">📄</span>
              </div>
              <div>
                <h3 className="font-medium mb-2">{content.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Document preview not available. Download to view the full content.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button asChild>
                    <a href={contentUrl} download target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={contentUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in New Tab
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="bg-muted/50 rounded-lg p-8 text-center">
            <p className="text-muted-foreground">Preview not available for this file type.</p>
          </div>
        )
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{content.name}</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">
              {content.source === 'upload' ? content.type.toUpperCase() : content.source.toUpperCase()}
            </Badge>
            {content.file_size && (
              <span className="text-sm text-muted-foreground">
                {formatFileSize(content.file_size)}
              </span>
            )}
            {content.duration && (
              <span className="text-sm text-muted-foreground">
                {Math.floor(content.duration / 60)}:{(content.duration % 60).toString().padStart(2, '0')}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls for images and PDFs (only for uploaded content) */}
          {content.source === 'upload' && (content.type === 'image' || content.type === 'pdf') && (
            <>
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium px-2">{zoom}%</span>
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="w-4 h-4" />
              </Button>
            </>
          )}

          {/* Download/Open button */}
          {(content.file_url || content.external_url) && (
            <Button variant="outline" size="sm" asChild>
              <a 
                href={content.source === 'upload' ? signedUrl ?? undefined : content.external_url} 
                download={content.source === 'upload'} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                {content.source === 'upload' ? (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Link
                  </>
                )}
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {renderContent()}
      </div>
    </div>
  )
}
