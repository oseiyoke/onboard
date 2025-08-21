'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, ExternalLink, ZoomIn, ZoomOut } from 'lucide-react'

interface ContentItem {
  id: string
  name: string
  type: 'pdf' | 'video' | 'document' | 'image'
  file_url: string
  file_size: number
  metadata: Record<string, unknown>
  created_at: string
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

export function ContentViewer({ content }: ContentViewerProps) {
  const [zoom, setZoom] = useState(100)

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50))

  const renderContent = () => {
    switch (content.type) {
      case 'image':
        return (
          <div className="flex items-center justify-center bg-muted/50 rounded-lg p-4">
            <img
              src={content.file_url}
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
              <source src={content.file_url} type="video/mp4" />
              <source src={content.file_url} type="video/webm" />
              <source src={content.file_url} type="video/quicktime" />
              Your browser does not support the video tag.
            </video>
          </div>
        )

      case 'pdf':
        return (
          <div className="bg-muted/50 rounded-lg p-4">
            <iframe
              src={`${content.file_url}#toolbar=1&navpanes=1&scrollbar=1`}
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
                    <a href={content.file_url} download target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={content.file_url} target="_blank" rel="noopener noreferrer">
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
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {content.type.toUpperCase()}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {formatFileSize(content.file_size)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls for images and PDFs */}
          {(content.type === 'image' || content.type === 'pdf') && (
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

          <Button variant="outline" size="sm" asChild>
            <a href={content.file_url} download target="_blank" rel="noopener noreferrer">
              <Download className="w-4 h-4 mr-2" />
              Download
            </a>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {renderContent()}
      </div>
    </div>
  )
}
