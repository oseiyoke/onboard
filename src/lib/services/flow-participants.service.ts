interface FlowParticipant {
  id: string
  user: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    role: 'admin' | 'participant'
    member: boolean | null
  }
  status: string
  started_at: string
  completed_at: string | null
  progress: {
    totalItems: number
    completedCount: number
    percentage: number
    currentStage: {
      title: string
      position: number
    } | null
  }
}

export interface FlowParticipantsResponse {
  flowId: string
  flowName: string
  participants: FlowParticipant[]
}

class FlowParticipantsService {
  async getFlowParticipants(flowId: string): Promise<FlowParticipantsResponse> {
    const response = await fetch(`/api/flows/${flowId}/participants`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to fetch flow participants')
    }

    return response.json()
  }
}

export const flowParticipantsService = new FlowParticipantsService()
export type { FlowParticipant }
