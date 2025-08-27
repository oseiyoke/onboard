'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  MoreHorizontal, 
  Search, 
  Filter,
  FileText,
  Image,
  Video,
  File,
  Download,
  Edit,
  Trash2,
  Eye,
  Youtube,
  ExternalLink,
  Globe,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ContentViewer } from './content-viewer'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'

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

const getFileIcon = (type: string | undefined, source?: string) => {
  if (source === 'youtube') return Youtube
  if (source === 'gdrive') return FileText
  if (source === 'external') return Globe
  
  if (!type) return File
  
  switch (type) {
    case 'image': return Image
    case 'video': return Video
    case 'pdf':
    case 'document': return FileText
    default: return File
  }
}

const getFileTypeColor = (type: string, source?: string) => {
  if (source === 'youtube') return 'bg-red-100 text-red-800'
  if (source === 'gdrive') return 'bg-blue-100 text-blue-800'
  if (source === 'external') return 'bg-gray-100 text-gray-800'
  
  switch (type) {
    case 'image': return 'bg-green-100 text-green-800'
    case 'video': return 'bg-blue-100 text-blue-800'
    case 'pdf': return 'bg-red-100 text-red-800'
    case 'document': return 'bg-primary/10 text-primary'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getSourceLabel = (source: string) => {
  switch (source) {
    case 'youtube': return 'YouTube'
    case 'gdrive': return 'Google Drive'
    case 'external': return 'External'
    case 'upload': return 'Upload'
    default: return 'Unknown'
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

type SortField = 'name' | 'type' | 'source' | 'created_at'
type SortDirection = 'asc' | 'desc'

export function ContentLibrary() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedSource, setSelectedSource] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const queryClient = useQueryClient()

  // Build query parameters
  const queryParams = new URLSearchParams({
    page: '1',
    limit: '50',
    ...(searchTerm && { search: searchTerm }),
    ...(selectedType !== 'all' && { type: selectedType }),
    ...(selectedSource !== 'all' && { source: selectedSource }),
  })

  // Fetch content from API
  const { data: response, isLoading } = useQuery({
    queryKey: ['content', searchTerm, selectedType, selectedSource],
    queryFn: async () => {
      const response = await fetch(`/api/content?${queryParams}`, {
        credentials: 'include',
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch content')
      }

      return response.json()
    },
  })

  // The API returns `{ data: ContentItem[], pagination: {...} }`
  // so we need to access the `data` property rather than `content`.
  let content = (response?.data as ContentItem[]) || []

  // Sort content based on current sort field and direction
  content = [...content].sort((a, b) => {
    let aValue: string | number
    let bValue: string | number

    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
        break
      case 'type':
        aValue = a.type
        bValue = b.type
        break
      case 'source':
        aValue = a.source
        bValue = b.source
        break
      case 'created_at':
        aValue = new Date(a.created_at).getTime()
        bValue = new Date(b.created_at).getTime()
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
  }

  // Delete content mutation
  const deleteContentMutation = useMutation({
    mutationFn: async (contentId: string) => {
      const response = await fetch(`/api/content/${contentId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to delete content')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'], exact: false })
    },
  })

  const contentTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'pdf', label: 'PDFs' },
    { value: 'image', label: 'Images' },
    { value: 'video', label: 'Videos' },
    { value: 'document', label: 'Documents' },
    { value: 'other', label: 'Other' },
  ]

  const contentSources = [
    { value: 'all', label: 'All Sources' },
    { value: 'upload', label: 'Uploads' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'gdrive', label: 'Google Drive' },
    { value: 'external', label: 'External Links' },
  ]

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
          <div className="flex gap-4 items-center flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  {contentTypes.find(t => t.value === selectedType)?.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {contentTypes.map(type => (
                  <DropdownMenuItem
                    key={type.value}
                    onClick={() => setSelectedType(type.value)}
                  >
                    {type.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  {contentSources.find(s => s.value === selectedSource)?.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {contentSources.map(source => (
                  <DropdownMenuItem
                    key={source.value}
                    onClick={() => setSelectedSource(source.value)}
                  >
                    {source.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

      {/* Content Table */}
      {content.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <File className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No content found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedType !== 'all' || selectedSource !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Upload your first piece of content to get started'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium text-muted-foreground">
                      <div className="flex items-center gap-2">
                        Thumbnail
                      </div>
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground">
                      <button 
                        className="flex items-center gap-2 hover:text-foreground transition-colors"
                        onClick={() => handleSort('name')}
                      >
                        Name
                        <SortIcon field="name" />
                      </button>
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground">
                      <button 
                        className="flex items-center gap-2 hover:text-foreground transition-colors"
                        onClick={() => handleSort('type')}
                      >
                        Type
                        <SortIcon field="type" />
                      </button>
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground">
                      <button 
                        className="flex items-center gap-2 hover:text-foreground transition-colors"
                        onClick={() => handleSort('source')}
                      >
                        Source
                        <SortIcon field="source" />
                      </button>
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground">
                      <button 
                        className="flex items-center gap-2 hover:text-foreground transition-colors"
                        onClick={() => handleSort('created_at')}
                      >
                        Added
                        <SortIcon field="created_at" />
                      </button>
                    </th>
                    <th className="text-right p-4 font-medium text-muted-foreground w-16">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {content.map((item) => {
                    const FileIcon = getFileIcon(item.type, item.source)
                    const contentUrl = item.source === 'upload' ? item.file_url : item.external_url
                    
                    return (
                      <tr key={item.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center justify-center w-12 h-12">
                            {item.thumbnail_url ? (
                              <img
                                src={item.thumbnail_url}
                                alt={item.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                <FileIcon className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-foreground truncate max-w-xs" title={item.name}>
                            {item.name}
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary" className={getFileTypeColor(item.type, item.source)}>
                            {item.type.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">
                            {getSourceLabel(item.source)}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted-foreground">
                            {formatDate(item.created_at)}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Preview
                                  </DropdownMenuItem>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-4xl max-h-[90vh]">
                                  <ContentViewer content={item} />
                                </DialogContent>
                              </Dialog>
                              
                              {contentUrl && (
                                <DropdownMenuItem asChild>
                                  <a href={contentUrl} download target="_blank" rel="noopener noreferrer">
                                    {item.source === 'upload' ? (
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
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Rename
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => deleteContentMutation.mutate(item.id)}
                                disabled={deleteContentMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
