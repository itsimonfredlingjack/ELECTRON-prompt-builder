import type { AiGenerationEvent, GenerationLifecycleState } from '@/types'

export interface GenerationSession {
  requestId: string | null
  state: GenerationLifecycleState
}

export interface GenerationSessionUpdate {
  accepted: boolean
  nextSession: GenerationSession
}

type KeyboardLikeEvent = Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey'>
export type KeyboardGenerationAction = 'start' | 'cancel' | null

const TERMINAL_STATES = new Set<GenerationLifecycleState>(['completed', 'cancelled', 'failed'])
const IN_FLIGHT_STATES = new Set<GenerationLifecycleState>(['preparing', 'generating', 'cancelling'])
const CANCELLABLE_STATES = new Set<GenerationLifecycleState>(['preparing', 'generating'])

export function createGenerationSession(requestId: string): GenerationSession {
  return {
    requestId,
    state: 'preparing',
  }
}

export function isGenerationInFlight(state: GenerationLifecycleState): boolean {
  return IN_FLIGHT_STATES.has(state)
}

export function isGenerationCancellable(state: GenerationLifecycleState): boolean {
  return CANCELLABLE_STATES.has(state)
}

export function applyCancelRequest(session: GenerationSession): GenerationSessionUpdate {
  if (!session.requestId || !isGenerationCancellable(session.state)) {
    return {
      accepted: false,
      nextSession: session,
    }
  }

  return {
    accepted: true,
    nextSession: {
      requestId: session.requestId,
      state: 'cancelling',
    },
  }
}

export function applyGenerationEvent(
  session: GenerationSession,
  event: AiGenerationEvent,
): GenerationSessionUpdate {
  if (!session.requestId || event.requestId !== session.requestId) {
    return {
      accepted: false,
      nextSession: session,
    }
  }

  const nextState = resolveNextState(session.state, event)
  if (!nextState) {
    return {
      accepted: false,
      nextSession: session,
    }
  }

  return {
    accepted: true,
    nextSession: {
      requestId: TERMINAL_STATES.has(nextState) ? null : session.requestId,
      state: nextState,
    },
  }
}

export function getKeyboardGenerationAction(
  event: KeyboardLikeEvent,
  generationState: GenerationLifecycleState,
): KeyboardGenerationAction {
  if (event.key === 'Escape' && isGenerationCancellable(generationState)) {
    return 'cancel'
  }

  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && !isGenerationInFlight(generationState)) {
    return 'start'
  }

  return null
}

function resolveNextState(
  currentState: GenerationLifecycleState,
  event: AiGenerationEvent,
): GenerationLifecycleState | null {
  switch (event.type) {
    case 'started':
      if (event.state === 'preparing' && currentState === 'preparing') {
        return 'preparing'
      }
      if (event.state === 'generating' && (currentState === 'preparing' || currentState === 'generating')) {
        return 'generating'
      }
      return null
    case 'chunk':
      if (currentState === 'preparing' || currentState === 'generating') {
        return 'generating'
      }
      return null
    case 'completed':
      if (currentState === 'preparing' || currentState === 'generating') {
        return 'completed'
      }
      return null
    case 'cancelled':
      if (currentState === 'preparing' || currentState === 'generating' || currentState === 'cancelling') {
        return 'cancelled'
      }
      return null
    case 'failed':
      if (currentState === 'preparing' || currentState === 'generating' || currentState === 'cancelling') {
        return 'failed'
      }
      return null
    default:
      return null
  }
}
