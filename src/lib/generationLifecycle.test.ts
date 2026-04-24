import { describe, expect, it } from 'vitest'
import type { AiGenerationEvent } from '@/types'
import {
  applyCancelRequest,
  applyGenerationEvent,
  createGenerationSession,
  getKeyboardGenerationAction,
} from '@/lib/generationLifecycle'

function started(requestId: string, state: 'preparing' | 'generating'): AiGenerationEvent {
  return { requestId, type: 'started', state }
}

function chunk(requestId: string, value = 'x'): AiGenerationEvent {
  return { requestId, type: 'chunk', chunk: value }
}

function completed(requestId: string): AiGenerationEvent {
  return { requestId, type: 'completed' }
}

function cancelled(requestId: string): AiGenerationEvent {
  return { requestId, type: 'cancelled' }
}

function failed(requestId: string): AiGenerationEvent {
  return {
    requestId,
    type: 'failed',
    error: {
      code: 'AI_PROVIDER_ERROR',
      message: 'boom',
    },
  }
}

describe('generation lifecycle session', () => {
  it('transitions through a normal success path', () => {
    const requestId = 'req-1'
    let session = createGenerationSession(requestId)
    expect(session.state).toBe('preparing')

    session = applyGenerationEvent(session, started(requestId, 'preparing')).nextSession
    expect(session.state).toBe('preparing')

    session = applyGenerationEvent(session, started(requestId, 'generating')).nextSession
    expect(session.state).toBe('generating')

    session = applyGenerationEvent(session, chunk(requestId, 'hello')).nextSession
    expect(session.state).toBe('generating')

    session = applyGenerationEvent(session, completed(requestId)).nextSession
    expect(session.state).toBe('completed')
    expect(session.requestId).toBeNull()
  })

  it('transitions through cancel during active generation', () => {
    const requestId = 'req-2'
    let session = createGenerationSession(requestId)
    session = applyGenerationEvent(session, started(requestId, 'generating')).nextSession
    expect(session.state).toBe('generating')

    session = applyCancelRequest(session).nextSession
    expect(session.state).toBe('cancelling')

    session = applyGenerationEvent(session, cancelled(requestId)).nextSession
    expect(session.state).toBe('cancelled')
    expect(session.requestId).toBeNull()
  })

  it('transitions through failure during generation', () => {
    const requestId = 'req-3'
    let session = createGenerationSession(requestId)
    session = applyGenerationEvent(session, started(requestId, 'generating')).nextSession
    session = applyGenerationEvent(session, failed(requestId)).nextSession

    expect(session.state).toBe('failed')
    expect(session.requestId).toBeNull()
  })

  it('does not accept late chunks after cancellation', () => {
    const requestId = 'req-4'
    let session = createGenerationSession(requestId)
    session = applyGenerationEvent(session, started(requestId, 'generating')).nextSession
    session = applyCancelRequest(session).nextSession
    session = applyGenerationEvent(session, cancelled(requestId)).nextSession

    const update = applyGenerationEvent(session, chunk(requestId, 'late'))
    expect(update.accepted).toBe(false)
    expect(update.nextSession).toEqual(session)
  })

  it('does not leak events across requests', () => {
    const session = createGenerationSession('req-5')
    const update = applyGenerationEvent(session, chunk('req-6', 'wrong'))

    expect(update.accepted).toBe(false)
    expect(update.nextSession).toEqual(session)
  })
})

describe('generation lifecycle keyboard actions', () => {
  it('maps Cmd/Ctrl+Enter to start only when generation is not in flight', () => {
    expect(getKeyboardGenerationAction({ key: 'Enter', metaKey: true, ctrlKey: false }, 'idle')).toBe('start')
    expect(getKeyboardGenerationAction({ key: 'Enter', metaKey: false, ctrlKey: true }, 'completed')).toBe('start')
    expect(getKeyboardGenerationAction({ key: 'Enter', metaKey: true, ctrlKey: false }, 'generating')).toBeNull()
  })

  it('maps Escape to cancel only when generation is cancellable', () => {
    expect(getKeyboardGenerationAction({ key: 'Escape', metaKey: false, ctrlKey: false }, 'preparing')).toBe('cancel')
    expect(getKeyboardGenerationAction({ key: 'Escape', metaKey: false, ctrlKey: false }, 'generating')).toBe('cancel')
    expect(getKeyboardGenerationAction({ key: 'Escape', metaKey: false, ctrlKey: false }, 'cancelling')).toBeNull()
    expect(getKeyboardGenerationAction({ key: 'Escape', metaKey: false, ctrlKey: false }, 'idle')).toBeNull()
  })
})
