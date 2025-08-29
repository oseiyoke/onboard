'use client'

import { useState } from 'react'
import { useContent, ContentItem } from '@/hooks/use-content'
import { Search, File, Video, Image, ExternalLink, Youtube } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

// Fetch content from API using shared hook
// Server-side filtering (search) is used but we still apply a simple client filter too

interface ContentSelectorProps {
  selectedContentId: string
  onSelectContent: (contentId: string) => void
}

export function ContentSelector({ selectedContentId, onSelectContent }: ContentSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const { data, isLoading } = useContent({ search: searchQuery || undefined })
  const content: ContentItem[] = (data?.data as ContentItem[]) ?? []

  const filteredContent = content.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getContentIcon = (type: string, source: string) => {
    if (source === 'youtube') return <Youtube className="w-4 h-4" />
    if (source === 'external') return <ExternalLink className="w-4 h-4" />

    switch (type) {
      case 'pdf':
      case 'document':
        return <File className="w-4 h-4" />
      case 'video':
        return <Video className="w-4 h-4" />
      case 'image':
        return <Image className="w-4 h-4" />
      default:
        return <File className="w-4 h-4" />
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return ''
    const minutes = Math.floor(seconds / 60)
    return `${minutes} min`
  }

  const getSourceBadge = (source: string) => {
    const variants = {
      upload: 'default',
      youtube: 'destructive',
      gdrive: 'secondary',
      external: 'outline'
    } as const

    return (
      <Badge variant={variants[source as keyof typeof variants] || 'outline'} className="text-xs">
        {source === 'upload' ? 'Uploaded' : source.charAt(0).toUpperCase() + source.slice(1)}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search content library..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Content List */}
      <ScrollArea className="h-64">
        <div className="space-y-2">
          {filteredContent.map((item) => (
            <Card
              key={item.id}
              className={`cursor-pointer transition-colors hover:bg-accent ${
                selectedContentId === item.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onSelectContent(item.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="text-muted-foreground mt-1">
                    {getContentIcon(item.type, item.source)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>

                    <div className="flex items-center gap-2 mt-1">
                      {getSourceBadge(item.source)}

                      {item.file_size && (
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(item.file_size)}
                        </span>
                      )}

                      {item.duration && (
                        <span className="text-xs text-muted-foreground">
                          {formatDuration(item.duration)}
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedContentId === item.id && (
                    <div className="text-primary">
                      ✓
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {filteredContent.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <File className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">
            {searchQuery ? 'No content found matching your search' : 'No content in your library yet'}
          </p>
        </div>
      )}

      {selectedContentId && (
        <div className="text-sm text-muted-foreground">
          Selected: {content.find(item => item.id === selectedContentId)?.name}
        </div>
      )}
    </div>
  )
}
