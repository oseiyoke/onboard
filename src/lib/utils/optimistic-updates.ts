import { Flow } from '@/lib/services/flow.service'

export type OptimisticAction = 
  | { type: 'DELETE_FLOW'; flowId: string }
  | { type: 'UPDATE_FLOW'; flowId: string; updates: Partial<Flow> }
  | { type: 'CREATE_FLOW'; flow: Flow }

export function applyOptimisticUpdate(flows: Flow[], action: OptimisticAction): Flow[] {
  switch (action.type) {
    case 'DELETE_FLOW':
      return flows.filter(flow => flow.id !== action.flowId)
    
    case 'UPDATE_FLOW':
      return flows.map(flow => 
        flow.id === action.flowId 
          ? { ...flow, ...action.updates, updated_at: new Date().toISOString() }
          : flow
      )
    
    case 'CREATE_FLOW':
      return [action.flow, ...flows]
    
    default:
      return flows
  }
}

export function revertOptimisticUpdate(originalFlows: Flow[], optimisticFlows: Flow[]): Flow[] {
  return originalFlows
}
