import type {
  AiGenerationEvent,
  AppError,
  GenerationLifecycleState,
  StartGenerationRequest,
} from '../../src/types/index.js'
import { GENERATION_TIMEOUT_MS } from '../utils/uploadConstants.js'
import { readPreparedImageAsDataUrl } from './imageUploadService.js'
import { getRuntimeSnapshot } from './ollamaRuntimeService.js'

const OLLAMA_API_BASE = 'http://127.0.0.1:11434'

interface ActiveGeneration {
  abortController: AbortController
  state: Extract<GenerationLifecycleState, 'preparing' | 'generating' | 'cancelling' | 'completed' | 'cancelled' | 'failed'>
  cancelRequested: boolean
  timeoutId: ReturnType<typeof setTimeout> | null
}

interface OllamaChatMessage {
  role: 'system' | 'user'
  content: string
  images?: string[]
}

class GenerationCancelledError extends Error {
  constructor() {
    super('Generation cancelled')
    this.name = 'GenerationCancelledError'
  }
}

const activeGenerations = new Map<string, ActiveGeneration>()

const ALLOWED_TRANSITIONS: Record<ActiveGeneration['state'], ActiveGeneration['state'][]> = {
  preparing: ['generating', 'cancelling', 'cancelled', 'failed'],
  generating: ['cancelling', 'completed', 'cancelled', 'failed'],
  cancelling: ['cancelled', 'failed'],
  completed: [],
  cancelled: [],
  failed: [],
}

export async function startGeneration(
  request: StartGenerationRequest,
  emit: (event: AiGenerationEvent) => void,
): Promise<void> {
  const { requestId } = request

  if (activeGenerations.has(requestId)) {
    emit({
      requestId,
      type: 'failed',
      error: appError('AI_PROVIDER_ERROR', `Generation request "${requestId}" is already active.`),
    })
    return
  }

  const active = registerGeneration(requestId)
  emit({ requestId, type: 'started', state: 'preparing' })

  try {
    const runtimeSnapshot = await getRuntimeSnapshot(request.model)
    validateGenerationRequest(runtimeSnapshot, request.model)
    throwIfCancelled(requestId)

    const messages = await buildOllamaMessages(request)
    throwIfCancelled(requestId)

    transitionGenerationState(requestId, 'generating')
    emit({ requestId, type: 'started', state: 'generating' })

    const response = await fetch(`${OLLAMA_API_BASE}/api/chat`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({
        model: request.model,
        messages,
        stream: true,
        think: false,
        options: {
          temperature: 0.35,
          num_predict: 4096,
        },
      }),
      signal: active.abortController.signal,
    })

    if (!response.ok) {
      throw await mapProviderError(response, request.model)
    }

    await streamResponse(requestId, response, emit)
    throwIfCancelled(requestId)

    transitionGenerationState(requestId, 'completed')
    emit({ requestId, type: 'completed' })
  } catch (error) {
    if (isCancellationPath(error, requestId)) {
      safelyTransitionGenerationState(requestId, 'cancelled')
      emit({ requestId, type: 'cancelled' })
    } else {
      safelyTransitionGenerationState(requestId, 'failed')
      emit({
        requestId,
        type: 'failed',
        error: normalizeError(error, request.model, requestId),
      })
    }
  } finally {
    clearGeneration(requestId)
  }
}

export function cancelGeneration(requestId: string): boolean {
  const active = activeGenerations.get(requestId)
  if (!active) {
    return false
  }

  if (active.cancelRequested || active.state === 'completed' || active.state === 'cancelled' || active.state === 'failed') {
    return false
  }

  active.cancelRequested = true
  if (active.state === 'preparing' || active.state === 'generating') {
    active.state = 'cancelling'
  }
  active.abortController.abort()
  return true
}

function registerGeneration(requestId: string): ActiveGeneration {
  const abortController = new AbortController()
  const active: ActiveGeneration = {
    abortController,
    state: 'preparing',
    cancelRequested: false,
    timeoutId: null,
  }

  active.timeoutId = setTimeout(() => {
    if (!active.cancelRequested) {
      abortController.abort()
    }
  }, GENERATION_TIMEOUT_MS)

  activeGenerations.set(requestId, active)
  return active
}

function clearGeneration(requestId: string): void {
  const active = activeGenerations.get(requestId)
  if (active?.timeoutId) {
    clearTimeout(active.timeoutId)
  }
  activeGenerations.delete(requestId)
}

function transitionGenerationState(requestId: string, nextState: ActiveGeneration['state']): void {
  const active = activeGenerations.get(requestId)
  if (!active) {
    throw new Error(`Cannot transition missing generation "${requestId}"`)
  }

  if (!ALLOWED_TRANSITIONS[active.state].includes(nextState)) {
    throw new Error(`Invalid generation transition for "${requestId}": ${active.state} -> ${nextState}`)
  }

  active.state = nextState
}

function safelyTransitionGenerationState(requestId: string, nextState: ActiveGeneration['state']): void {
  const active = activeGenerations.get(requestId)
  if (!active) {
    return
  }

  if (ALLOWED_TRANSITIONS[active.state].includes(nextState)) {
    active.state = nextState
  }
}

function throwIfCancelled(requestId: string): void {
  const active = activeGenerations.get(requestId)
  if (!active || active.cancelRequested || active.state === 'cancelling') {
    throw new GenerationCancelledError()
  }
}

function isCancellationPath(error: unknown, requestId: string): boolean {
  const active = activeGenerations.get(requestId)
  if (error instanceof GenerationCancelledError) {
    return true
  }

  if (active?.cancelRequested && error instanceof Error && error.name === 'AbortError') {
    return true
  }

  return false
}

function validateGenerationRequest(
  runtimeSnapshot: Awaited<ReturnType<typeof getRuntimeSnapshot>>,
  modelId: string,
): void {
  if (!runtimeSnapshot.daemonReachable) {
    throw appError('NETWORK_ERROR', 'Cannot connect to Ollama. Make sure Ollama is running.')
  }

  if (!runtimeSnapshot.modelListAvailable) {
    throw appError('AI_PROVIDER_ERROR', 'Ollama is reachable, but the installed model list is unavailable.')
  }

  if (!runtimeSnapshot.selectedModelInstalled) {
    throw appError('AI_PROVIDER_ERROR', `The selected model "${modelId}" is not installed in Ollama.`)
  }

  if (!runtimeSnapshot.selectedModelReady) {
    throw appError('AI_PROVIDER_ERROR', `The selected model "${modelId}" is installed, but not ready to use yet.`)
  }
}

async function buildOllamaMessages(request: StartGenerationRequest): Promise<OllamaChatMessage[]> {
  if (!request.imageTempId) {
    return [
      { role: 'system', content: request.systemPrompt },
      { role: 'user', content: request.userInput },
    ]
  }

  const imageDataUrl = await readPreparedImageAsDataUrl(request.imageTempId)
  const imageBase64 = imageDataUrl.split(',', 2)[1] ?? imageDataUrl

  return [
    { role: 'system', content: request.systemPrompt },
    {
      role: 'user',
      content: request.userInput,
      images: [imageBase64],
    },
  ]
}

function buildHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
  }
}

function emitChunksFromLines(
  requestId: string,
  lines: string[],
  emit: (event: AiGenerationEvent) => void,
): void {
  for (const line of lines) {
    const active = activeGenerations.get(requestId)
    if (!active || active.state !== 'generating' || active.cancelRequested) {
      throw new GenerationCancelledError()
    }

    const trimmed = line.trim()
    if (!trimmed) continue

    try {
      const content = getOllamaChunkContent(trimmed)
      if (content) {
        emit({ requestId, type: 'chunk', chunk: content })
      }
    } catch {
      // Ignore malformed provider chunks.
    }
  }
}

async function streamResponse(
  requestId: string,
  response: Response,
  emit: (event: AiGenerationEvent) => void,
): Promise<void> {
  const reader = response.body?.getReader()
  if (!reader) {
    throw appError('AI_PROVIDER_ERROR', 'No response body from Ollama.')
  }

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    for (;;) {
      const active = activeGenerations.get(requestId)
      if (!active || active.state !== 'generating' || active.cancelRequested) {
        throw new GenerationCancelledError()
      }

      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      emitChunksFromLines(requestId, lines, emit)
    }

    if (buffer.trim()) {
      emitChunksFromLines(requestId, [buffer], emit)
    }
  } finally {
    reader.releaseLock()
  }
}

function getOllamaChunkContent(line: string): string | undefined {
  const payload = JSON.parse(line) as {
    message?: { content?: string }
  }

  return payload.message?.content
}

async function mapProviderError(response: Response, modelId: string): Promise<AppError> {
  const errorPayload = (await response.json().catch(() => ({}))) as {
    error?: { message?: string }
    message?: string
  }
  const message = errorPayload.error?.message || errorPayload.message || response.statusText

  if (response.status === 404 || /model.*not found|not found.*model/i.test(message)) {
    return appError('AI_PROVIDER_ERROR', `Ollama could not find ${modelId}. Make sure the model is installed locally.`)
  }

  return appError('AI_PROVIDER_ERROR', message || `Ollama returned ${response.status}.`)
}

function normalizeError(error: unknown, modelId: string, requestId: string): AppError {
  if (isAppError(error)) {
    return error
  }

  const active = activeGenerations.get(requestId)
  if (error instanceof Error && error.name === 'AbortError' && !active?.cancelRequested) {
    return appError('AI_PROVIDER_ERROR', 'Generation timed out before Ollama completed the response.')
  }

  if (error instanceof Error && /fetch|network/i.test(error.message)) {
    return appError(
      'NETWORK_ERROR',
      `Cannot connect to Ollama. Make sure Ollama is running and ${modelId} is installed locally.`,
    )
  }

  return appError('UNKNOWN_ERROR', error instanceof Error ? error.message : 'Unexpected error during generation.')
}

function appError(code: AppError['code'], message: string): AppError {
  return { code, message }
}

function isAppError(error: unknown): error is AppError {
  return typeof error === 'object' && error !== null && 'code' in error && 'message' in error
}
