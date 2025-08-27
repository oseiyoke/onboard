'use client'

import { z } from 'zod'

// Types for client-side usage
export interface ParticipantEnrollment {
  id: string
  flow_id: string
  flow: {
    id: string
    name: string
    description: string | null
  }
  status: string
  started_at: string
  completed_at: string | null
  progress: {
    completed_items: number
    total_items: number
    percentage: number
  }
}

export interface ParticipantFlowPreview {
  flow: {
    id: string
    name: string
    description: string | null
  }
  enrollment: {
    id: string
    status: string
    started_at: string
    completed_at: string | null
  } | null
  progress: {
    completed_items: number
    total_items: number
    percentage: number
  } | null
}

export interface UserFlowProgress {
  enrollment_id: string
  flow_id: string
  flow_title: string
  started_at: string
  completed_at: string | null
  stages: {
    stage_id: string
    stage_title: string
    stage_position: number
    started_at: string | null
    completed_at: string | null
    items: {
      item_id: string
      item_title: string
      item_type: 'content' | 'assessment' | 'info'
      item_position: number
      completed_at: string | null
      score: number | null
    }[]
  }[]
}

/**
 * Client-side progress service that uses fetch API to communicate with backend
 * This service is safe to use in client components and hooks
 */
export class ClientProgressService {
  // Participant-specific methods
  async getParticipantEnrollments(): Promise<ParticipantEnrollment[]> {
    const response = await fetch('/api/progress/enrollments')
    
    if (!response.ok) {
      throw new Error('Failed to fetch enrollments')
    }
    
    const data = await response.json()
    // API returns { enrollments: [...] }
    return data.enrollments
  }

  async getAvailableFlows(): Promise<ParticipantFlowPreview[]> {
    const response = await fetch('/api/flows/available')
    
    if (!response.ok) {
      throw new Error('Failed to fetch available flows')
    }
    
    const data = await response.json()
    // API returns { flows: [...] }
    return data.flows
  }

  async createEnrollment(flowId: string): Promise<string> {
    const response = await fetch('/api/progress/enrollments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        flow_id: flowId,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create enrollment')
    }

    const data = await response.json()
    // API returns { enrollment_id: "..." }
    return data.enrollment_id
  }

  async startStage(stageId: string, enrollmentId: string): Promise<void> {
    const response = await fetch(`/api/progress/stages/${stageId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        enrollment_id: enrollmentId,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to start stage')
    }
  }

  async completeStageItem(itemId: string, enrollmentId: string, score?: number): Promise<void> {
    const response = await fetch(`/api/progress/stage-items/${itemId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        enrollment_id: enrollmentId,
        ...(score !== undefined && { score }),
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to complete stage item')
    }
  }

  async getEnrollmentProgress(enrollmentId: string): Promise<UserFlowProgress | null> {
    const response = await fetch(`/api/progress/enrollments/${enrollmentId}`)
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    // API returns { progress: {...} }
    return data.progress
  }
}

// Export singleton instance
export const clientProgressService = new ClientProgressService()
