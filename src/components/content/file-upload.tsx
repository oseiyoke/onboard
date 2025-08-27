'use client'

import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  File, 
  Image, 
  Video, 
  FileText, 
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileWithPreview extends File {
  preview?: string
  uploadProgress?: number
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'error'
  uploadError?: string
}

interface FileUploadProps {
  onUploadComplete?: (files: UploadedFile[]) => void
  maxFiles?: number
  maxSize?: number // in bytes
  accept?: string[]
}

interface UploadedFile {
  key: string
  name: string
  size: number
  type: string
  url: string
}

const getFileIcon = (type: string | undefined) => {
  if (!type) return File
  if (type.startsWith('image/')) return Image
  if (type.startsWith('video/')) return Video
  if (type.includes('pdf') || type.includes('document') || type.includes('text')) return FileText
  return File
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function FileUpload({ 
  onUploadComplete, 
  maxFiles = 10, 
  maxSize = 50 * 1024 * 1024,
  accept = [
    'image/*',
    'video/*',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [uploading, setUploading] = useState(false)
  const queryClient = useQueryClient()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => {
      const fileWithPreview = Object.assign(file, {
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        uploadProgress: 0,
        uploadStatus: 'pending' as const
      })
      return fileWithPreview
    })
    
    setFiles(prev => [...prev, ...newFiles].slice(0, maxFiles))
  }, [maxFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize,
    maxFiles,
  })

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFile = async (file: FileWithPreview, index: number) => {
    try {
      // Update file status to uploading
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, uploadStatus: 'uploading', uploadProgress: 0 } : f
      ))

      // Send file to our server which will stream it to R2 (avoids CORS)
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/stream', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => null)
        throw new Error(error?.error || 'Failed to upload file')
      }

      const { fileKey, publicUrl } = await response.json()

      // Update file status to success
      setFiles(prev => prev.map((f, i) => 
        i === index ? { 
          ...f, 
          uploadStatus: 'success', 
          uploadProgress: 100,
          uploadedData: {
            key: fileKey,
            name: file.name,
            size: file.size,
            type: file.type,
            url: publicUrl
          }
        } : f
      ))

      return {
        key: fileKey,
        name: file.name,
        size: file.size,
        type: file.type,
        url: publicUrl,
      }

    } catch (error) {
      console.error('Upload error:', error)
      setFiles(prev => prev.map((f, i) => 
        i === index ? { 
          ...f, 
          uploadStatus: 'error', 
          uploadError: error instanceof Error ? error.message : 'Upload failed'
        } : f
      ))
      throw error
    }
  }

  const handleUploadAll = async () => {
    setUploading(true)
    const uploadPromises = files
      .filter(f => f.uploadStatus === 'pending')
      .map((file, originalIndex) => {
        const actualIndex = files.findIndex(f => f === file)
        return uploadFile(file, actualIndex)
      })

    try {
      const results = await Promise.allSettled(uploadPromises)
      const successfulUploads = results
        .filter((result): result is PromiseFulfilledResult<UploadedFile> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value)

      // Register each successful upload with our content API
      if (successfulUploads.length > 0) {
        for (const upload of successfulUploads) {
          try {
            await fetch('/api/content', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                name: upload.name,
                type: getContentType(upload.type),
                source: 'upload',
                file_url: upload.url,
                file_size: upload.size,
                metadata: {},
              }),
            })
          } catch (error) {
            console.error('Failed to register upload with API:', error)
          }
        }

        if (onUploadComplete) {
          onUploadComplete(successfulUploads)
        }
        // Invalidate content queries so the library refreshes
        queryClient.invalidateQueries({ queryKey: ['content'], exact: false })
      }
    } catch (error) {
      console.error('Batch upload error:', error)
    } finally {
      setUploading(false)
    }
  }

  const getContentType = (mimeType: string): 'pdf' | 'video' | 'image' | 'document' | 'other' => {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.includes('pdf')) return 'pdf'
    if (mimeType.includes('document') || mimeType.includes('text') || mimeType.includes('word')) return 'document'
    return 'other'
  }

  const pendingFiles = files.filter(f => f.uploadStatus === 'pending')
  const hasFiles = files.length > 0

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
              'hover:border-primary hover:bg-primary/5'
            )}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to select files
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">PDF</Badge>
              <Badge variant="outline">Images</Badge>
              <Badge variant="outline">Videos</Badge>
              <Badge variant="outline">Documents</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Max {formatFileSize(maxSize)} per file, up to {maxFiles} files
            </p>
          </div>

      {/* File List */}
      {hasFiles && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Files ({files.length})</h3>
                {pendingFiles.length > 0 && (
                  <Button 
                    onClick={handleUploadAll} 
                    disabled={uploading}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload All ({pendingFiles.length})
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {files.map((file, index) => {
                  const FileIcon = getFileIcon(file.type)
                  
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-shrink-0">
                        {file.preview ? (
                          <img
                            src={file.preview}
                            alt={file.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                            <FileIcon className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                        
                        {file.uploadStatus === 'uploading' && (
                          <Progress value={file.uploadProgress} className="mt-1" />
                        )}
                        
                        {file.uploadStatus === 'error' && (
                          <p className="text-xs text-red-500 mt-1">{file.uploadError}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {file.uploadStatus === 'pending' && (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                        {file.uploadStatus === 'uploading' && (
                          <Badge variant="secondary">Uploading...</Badge>
                        )}
                        {file.uploadStatus === 'success' && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                        {file.uploadStatus === 'error' && (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          disabled={file.uploadStatus === 'uploading'}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
