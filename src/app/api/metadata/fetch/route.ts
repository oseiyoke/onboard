import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth/server'
import { withErrorHandler, createSuccessResponse, createErrorResponse } from '@/lib/api/errors'
import { z } from 'zod'

const FetchMetadataSchema = z.object({
  url: z.string().url('Invalid URL'),
})

interface YouTubeMetadata {
  title: string
  thumbnail: string
  duration: number
  type: 'video'
  source: 'youtube'
}

interface ExternalMetadata {
  title: string
  thumbnail?: string
  type: 'document' | 'other'
  source: 'external'
}

// Extract YouTube video ID from various YouTube URL formats
function extractYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

// Check if URL is a Google Drive file
function isGoogleDriveUrl(url: string): boolean {
  return url.includes('drive.google.com') && (url.includes('/file/d/') || url.includes('/open?id='))
}

// Extract Google Drive file ID
function extractGoogleDriveId(url: string): string | null {
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileMatch) return fileMatch[1]
  
  const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (openMatch) return openMatch[1]
  
  return null
}

async function fetchYouTubeMetadata(videoId: string): Promise<YouTubeMetadata> {
  // Using YouTube oEmbed API (no API key required)
  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
  
  try {
    const response = await fetch(oembedUrl)
    if (!response.ok) {
      throw new Error('Failed to fetch YouTube metadata')
    }
    
    const data = await response.json()
    
    return {
      title: data.title || 'YouTube Video',
      thumbnail: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      duration: 0, // oEmbed doesn't provide duration, would need YouTube Data API
      type: 'video',
      source: 'youtube'
    }
  } catch (error) {
    console.error('Error fetching YouTube metadata:', error)
    return {
      title: 'YouTube Video',
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      duration: 0,
      type: 'video',
      source: 'youtube'
    }
  }
}

async function fetchGoogleDriveMetadata(fileId: string): Promise<ExternalMetadata> {
  // For Google Drive, we'll provide basic metadata since the Drive API requires auth
  // In a production app, you'd want to use the Google Drive API
  return {
    title: 'Google Drive File',
    thumbnail: undefined,
    type: 'document',
    source: 'gdrive' as 'external'
  }
}

async function fetchExternalMetadata(url: string): Promise<ExternalMetadata> {
  try {
    // Try to fetch the page and extract title from HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OnboardBot/1.0)',
      },
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch external content')
    }
    
    const html = await response.text()
    const titleMatch = html.match(/<title>(.*?)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : new URL(url).hostname
    
    return {
      title,
      type: 'other',
      source: 'external'
    }
  } catch (error) {
    console.error('Error fetching external metadata:', error)
    return {
      title: new URL(url).hostname,
      type: 'other',
      source: 'external'
    }
  }
}

export const POST = withErrorHandler(async (request: NextRequest) => {
  const user = await requireAuth(request)
  
  const body = await request.json()
  const { url } = FetchMetadataSchema.parse(body)
  
  let metadata: YouTubeMetadata | ExternalMetadata
  
  // Check if it's a YouTube URL
  const youtubeId = extractYouTubeId(url)
  if (youtubeId) {
    metadata = await fetchYouTubeMetadata(youtubeId)
    return createSuccessResponse({ 
      ...metadata,
      external_url: url,
      suggested_name: metadata.title
    })
  }
  
  // Check if it's a Google Drive URL
  if (isGoogleDriveUrl(url)) {
    const driveId = extractGoogleDriveId(url)
    if (driveId) {
      metadata = await fetchGoogleDriveMetadata(driveId)
      return createSuccessResponse({
        ...metadata,
        external_url: url,
        suggested_name: metadata.title,
        source: 'gdrive'
      })
    }
  }
  
  // Handle as external URL
  metadata = await fetchExternalMetadata(url)
  return createSuccessResponse({
    ...metadata,
    external_url: url,
    suggested_name: metadata.title
  })
})
