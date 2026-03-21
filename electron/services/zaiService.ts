import type {
  AiGenerationEvent,
  AppError,
  ConnectionCheckRequest,
  MultimodalGenerateRequest,
} from '../../src/types/index.js'
import { GENERATION_TIMEOUT_MS } from '../utils/uploadConstants.js'
import { getModelCapability } from '../utils/modelCapabilities.js'
import { readPreparedImageAsDataUrl } from './imageUploadService.js'

const OLLAMA_API_BASE = 'http://127.0.0.1:11434'

interface ActiveGeneration {
  abortController: AbortController
}

const activeGenerations = new Map<string, ActiveGeneration>()

type UserMessageContent =
  | string
  | Array<
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string } }
    >

interface OllamaChatMessage {
  role: 'system' | 'user'
  content: string
  images?: string[]
}

export async function checkConnection(request: ConnectionCheckRequest): Promise<boolean> {
  const capability = getModelCapability(request.model)
  if (!capability || capability.provider !== 'ollama') return false

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8_000)

  try {
    const response = await fetch(`${OLLAMA_API_BASE}/api/chat`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({
        model: request.model,
        messages: [{ role: 'user', content: 'Hi' }],
        stream: false,
        think: false,
      }),
      signal: controller.signal,
    })

    return response.ok
  } catch {
    return false
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function startGeneration(
  requestId: string,
  request: MultimodalGenerateRequest,
  emit: (event: AiGenerationEvent) => void,
): Promise<void> {
  getRequiredModelCapability(request.model)

  const abortController = new AbortController()
  const timeoutId = setTimeout(() => abortController.abort(), GENERATION_TIMEOUT_MS)
  activeGenerations.set(requestId, { abortController })

  try {
    emit(progressEvent(requestId, 20, 'Preparing prompt...'))

    const messages = await buildOllamaMessages(request)
    emit(progressEvent(requestId, 45, 'Sending prompt to local Ollama...'))

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
      signal: abortController.signal,
    })

    if (!response.ok) throw await mapProviderError(response, request.model)

    emit(progressEvent(requestId, 70, `Generating with local ${request.model}...`))
    await streamResponse(requestId, response, emit)
    emit({ requestId, type: 'complete' })
  } catch (error) {
    emit({
      requestId,
      type: 'error',
      error: normalizeError(error, request.model),
    })
  } finally {
    clearTimeout(timeoutId)
    activeGenerations.delete(requestId)
  }
}

export function cancelGeneration(requestId: string): void {
  activeGenerations.get(requestId)?.abortController.abort()
}

export async function buildUserContent(request: MultimodalGenerateRequest): Promise<UserMessageContent> {
  const capability = getRequiredModelCapability(request.model)
  if (request.imageTempId) {
    if (!capability.supportsImages) {
      throw appError('MODEL_NOT_SUPPORTED', 'The selected model does not support image analysis.')
    }

    const imageDataUrl = await readPreparedImageAsDataUrl(request.imageTempId)
    return [
      { type: 'text', text: request.userInput },
      { type: 'image_url', image_url: { url: imageDataUrl } },
    ]
  }

  return request.userInput
}

async function buildOllamaMessages(request: MultimodalGenerateRequest): Promise<OllamaChatMessage[]> {
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

function getRequiredModelCapability(modelId: string) {
  const capability = getModelCapability(modelId)
  if (!capability) {
    throw appError('AI_PROVIDER_ERROR', `The selected model "${modelId}" is not available.`)
  }

  if (capability.provider !== 'ollama') {
    throw appError('AI_PROVIDER_ERROR', `${modelId} is not configured as a local Ollama model.`)
  }

  return capability
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
    const trimmed = line.trim()
    if (!trimmed) {
      continue
    }

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

function progressEvent(
  requestId: string,
  progress: number,
  message: string,
): AiGenerationEvent {
  return { requestId, type: 'progress', stage: 'analyzing', progress, message }
}

function normalizeError(error: unknown, modelId: string): AppError {
  if (isAppError(error)) {
    return error
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return appError('AI_PROVIDER_ERROR', 'Local generation stopped.')
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
