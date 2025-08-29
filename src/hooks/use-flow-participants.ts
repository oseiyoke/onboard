'use client'

import { useState, useEffect } from 'react'
import { flowParticipantsService, FlowParticipant, FlowParticipantsResponse } from '@/lib/services/flow-participants.service'

interface UseFlowParticipantsReturn {
  participants: FlowParticipant[]
  loading: boolean
  error: Error | null
  refreshParticipants: () => Promise<void>
  flowName: string
}

export function useFlowParticipants(flowId: string): UseFlowParticipantsReturn {
  const [participants, setParticipants] = useState<FlowParticipant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [flowName, setFlowName] = useState('')

  const fetchParticipants = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await flowParticipantsService.getFlowParticipants(flowId)
      setParticipants(response.participants)
      setFlowName(response.flowName)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch participants'))
      setParticipants([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (flowId) {
      fetchParticipants()
    }
  }, [flowId])

  return {
    participants,
    loading,
    error,
    refreshParticipants: fetchParticipants,
    flowName,
  }
}
