import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { readPreparedImageAsDataUrl } = vi.hoisted(() => ({
  readPreparedImageAsDataUrl: vi.fn(),
}))

vi.mock('./imageUploadService.js', () => ({
  readPreparedImageAsDataUrl,
}))

import { buildUserContent, checkConnection, startGeneration } from './zaiService'

function createOllamaChatStreamResponse(chunks: string[]): Response {
  const body = chunks
    .map((chunk, index) =>
      JSON.stringify({
        model: 'qwen3.5:4b',
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

describe('buildUserContent', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    readPreparedImageAsDataUrl.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns plain text content when no image is attached', async () => {
    await expect(
      buildUserContent({
        model: 'qwen3.5:4b',
        systemPrompt: 'system',
        userInput: 'hello world',
      }),
    ).resolves.toBe('hello world')
  })

  it('builds multimodal content for the local Qwen model', async () => {
    readPreparedImageAsDataUrl.mockResolvedValue('data:image/png;base64,abc123')

    await expect(
      buildUserContent({
        model: 'qwen3.5:4b',
        systemPrompt: 'system',
        userInput: 'hello world',
        imageTempId: 'temp-1',
      }),
    ).resolves.toEqual([
      { type: 'text', text: 'hello world' },
      { type: 'image_url', image_url: { url: 'data:image/png;base64,abc123' } },
    ])
  })
})

describe('checkConnection', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('checks the local Ollama endpoint for the Qwen model', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: { content: 'ok' }, done: true }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(checkConnection({ model: 'qwen3.5:4b' })).resolves.toBe(true)

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:11434/api/chat',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          model: 'qwen3.5:4b',
          messages: [{ role: 'user', content: 'Hi' }],
          stream: false,
          think: false,
        }),
      }),
    )
  })

  it('returns false for unknown models', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(checkConnection({ model: 'unknown-model' })).resolves.toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('startGeneration', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    readPreparedImageAsDataUrl.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('routes Qwen text generation through Ollama and emits streamed chunks', async () => {
    const fetchMock = vi.fn().mockResolvedValue(createOllamaChatStreamResponse(['Hej', ' världen']))
    vi.stubGlobal('fetch', fetchMock)
    const emitted: unknown[] = []

    await startGeneration(
      'request-1',
      {
        model: 'qwen3.5:4b',
        systemPrompt: 'system',
        userInput: 'hello world',
      },
      (event) => emitted.push(event),
    )

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:11434/api/chat',
      expect.objectContaining({
        body: JSON.stringify({
          model: 'qwen3.5:4b',
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
        expect.objectContaining({ type: 'chunk', chunk: 'Hej' }),
        expect.objectContaining({ type: 'chunk', chunk: ' världen' }),
        expect.objectContaining({ type: 'complete' }),
      ]),
    )
  })

  it('routes image generation through Ollama with image payload', async () => {
    readPreparedImageAsDataUrl.mockResolvedValue('data:image/png;base64,glm')
    const fetchMock = vi.fn().mockResolvedValue(createOllamaChatStreamResponse(['klart']))
    vi.stubGlobal('fetch', fetchMock)

    await startGeneration(
      'request-2',
      {
        model: 'qwen3.5:4b',
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
          model: 'qwen3.5:4b',
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

  it('maps Ollama network failures to a local runtime error message', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('fetch failed'))
    vi.stubGlobal('fetch', fetchMock)
    const emitted: unknown[] = []

    await startGeneration(
      'request-3',
      {
        model: 'qwen3.5:4b',
        systemPrompt: 'system',
        userInput: 'hello world',
      },
      (event) => emitted.push(event),
    )

    expect(emitted).toContainEqual(
      expect.objectContaining({
        type: 'error',
        error: expect.objectContaining({
          code: 'NETWORK_ERROR',
          message: expect.stringContaining('Ollama'),
        }),
      }),
    )
  })
})
