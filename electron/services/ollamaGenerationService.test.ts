import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { readPreparedImageAsDataUrl } = vi.hoisted(() => ({
  readPreparedImageAsDataUrl: vi.fn(),
}))

const { getRuntimeSnapshot } = vi.hoisted(() => ({
  getRuntimeSnapshot: vi.fn(),
}))

vi.mock('./imageUploadService.js', () => ({
  readPreparedImageAsDataUrl,
}))

vi.mock('./ollamaRuntimeService.js', () => ({
  getRuntimeSnapshot,
}))

import { cancelGeneration, startGeneration } from './ollamaGenerationService'

function createOllamaChatStreamResponse(chunks: string[]): Response {
  const body = chunks
    .map((chunk, index) =>
      JSON.stringify({
        model: 'qwen2.5:7b',
        message: { role: 'assistant', content: chunk },
        done: index === chunks.length - 1,
      }),
    )
    .join('\n')

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/x-ndjson',
    },
  })
}

function createControlledOllamaStream() {
  const encoder = new TextEncoder()
  let streamController: ReadableStreamDefaultController<Uint8Array>

  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      streamController = controller
    },
  })

  return {
    response: new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-ndjson',
      },
    }),
    pushChunk(chunk: string) {
      streamController.enqueue(
        encoder.encode(
          `${JSON.stringify({
            model: 'qwen2.5:7b',
            message: { role: 'assistant', content: chunk },
            done: false,
          })}\n`,
        ),
      )
    },
    close() {
      streamController.close()
    },
  }
}

describe('startGeneration lifecycle', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    readPreparedImageAsDataUrl.mockReset()
    getRuntimeSnapshot.mockReset()
    getRuntimeSnapshot.mockResolvedValue({
      daemonReachable: true,
      modelListAvailable: true,
      models: [{ id: 'qwen2.5:7b' }],
      selectedModelId: 'qwen2.5:7b',
      selectedModelInstalled: true,
      selectedModelReady: true,
      selectedModelVisionSupport: 'unsupported',
      notice: null,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('emits started -> chunk -> completed on normal generation success', async () => {
    const fetchMock = vi.fn().mockResolvedValue(createOllamaChatStreamResponse(['Hej', ' världen']))
    vi.stubGlobal('fetch', fetchMock)
    const emitted: unknown[] = []

    await startGeneration(
      {
        requestId: 'request-1',
        model: 'qwen2.5:7b',
        systemPrompt: 'system',
        userInput: 'hello world',
      },
      (event) => emitted.push(event),
    )

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:11434/api/chat',
      expect.objectContaining({
        body: JSON.stringify({
          model: 'qwen2.5:7b',
          messages: [
            { role: 'system', content: 'system' },
            { role: 'user', content: 'hello world' },
          ],
          stream: true,
          think: false,
          options: {
            temperature: 0.35,
            num_predict: 4096,
          },
        }),
      }),
    )

    expect(emitted).toEqual(
      expect.arrayContaining([
        { requestId: 'request-1', type: 'started', state: 'preparing' },
        { requestId: 'request-1', type: 'started', state: 'generating' },
        expect.objectContaining({ requestId: 'request-1', type: 'chunk', chunk: 'Hej' }),
        expect.objectContaining({ requestId: 'request-1', type: 'chunk', chunk: ' världen' }),
        { requestId: 'request-1', type: 'completed' },
      ]),
    )
  })

  it('emits cancelled when cancel is requested during active generation', async () => {
    const stream = createControlledOllamaStream()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(stream.response))
    const emitted: unknown[] = []

    const runPromise = startGeneration(
      {
        requestId: 'request-2',
        model: 'qwen2.5:7b',
        systemPrompt: 'system',
        userInput: 'cancel test',
      },
      (event) => emitted.push(event),
    )

    await Promise.resolve()
    expect(cancelGeneration('request-2')).toBe(true)
    stream.close()
    await runPromise

    expect(emitted).toEqual(
      expect.arrayContaining([
        { requestId: 'request-2', type: 'started', state: 'preparing' },
        { requestId: 'request-2', type: 'cancelled' },
      ]),
    )
    expect(emitted).not.toContainEqual(expect.objectContaining({ type: 'failed' }))
  })

  it('emits failed when provider returns an error response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('boom', { status: 500 })))
    const emitted: unknown[] = []

    await startGeneration(
      {
        requestId: 'request-3',
        model: 'qwen2.5:7b',
        systemPrompt: 'system',
        userInput: 'fail test',
      },
      (event) => emitted.push(event),
    )

    expect(emitted).toEqual(
      expect.arrayContaining([
        { requestId: 'request-3', type: 'started', state: 'preparing' },
        { requestId: 'request-3', type: 'started', state: 'generating' },
        expect.objectContaining({
          requestId: 'request-3',
          type: 'failed',
          error: expect.objectContaining({ code: 'AI_PROVIDER_ERROR' }),
        }),
      ]),
    )
  })

  it('does not emit late chunks after cancellation', async () => {
    const stream = createControlledOllamaStream()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(stream.response))
    const emitted: unknown[] = []

    const runPromise = startGeneration(
      {
        requestId: 'request-4',
        model: 'qwen2.5:7b',
        systemPrompt: 'system',
        userInput: 'late chunk test',
      },
      (event) => emitted.push(event),
    )

    await Promise.resolve()
    stream.pushChunk('before-cancel')
    await Promise.resolve()
    await Promise.resolve()
    expect(cancelGeneration('request-4')).toBe(true)

    try {
      stream.pushChunk('late-chunk')
    } catch {
      // Stream may already be closed by abort; this is acceptable.
    }

    stream.close()
    await runPromise

    const emittedChunks = emitted
      .filter((event): event is { type: 'chunk'; chunk: string } => {
        return typeof event === 'object' && event !== null && 'type' in event && event.type === 'chunk'
      })
      .map((event) => event.chunk)

    expect(emitted).toContainEqual({ requestId: 'request-4', type: 'cancelled' })
    expect(emittedChunks).not.toContain('late-chunk')
  })

  it('routes image generation through Ollama with image payload', async () => {
    readPreparedImageAsDataUrl.mockResolvedValue('data:image/png;base64,glm')
    const fetchMock = vi.fn().mockResolvedValue(createOllamaChatStreamResponse(['klart']))
    vi.stubGlobal('fetch', fetchMock)

    await startGeneration(
      {
        requestId: 'request-5',
        model: 'qwen2.5:7b',
        systemPrompt: 'system',
        userInput: 'analyze this image',
        imageTempId: 'temp-1',
      },
      () => undefined,
    )

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:11434/api/chat',
      expect.objectContaining({
        body: JSON.stringify({
          model: 'qwen2.5:7b',
          messages: [
            { role: 'system', content: 'system' },
            {
              role: 'user',
              content: 'analyze this image',
              images: ['glm'],
            },
          ],
          stream: true,
          think: false,
          options: {
            temperature: 0.35,
            num_predict: 4096,
          },
        }),
      }),
    )
  })
})
