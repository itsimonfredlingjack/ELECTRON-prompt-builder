import { afterEach, describe, expect, it, vi } from 'vitest'
import { getRuntimeSnapshot } from './ollamaRuntimeService'

describe('getRuntimeSnapshot', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('discovers installed models from Ollama and marks the selected model as ready', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            models: [{ model: 'qwen2.5:7b' }, { model: 'llava:7b' }],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            capabilities: ['vision'],
          }),
          { status: 200 },
        ),
      )

    vi.stubGlobal('fetch', fetchMock)

    await expect(getRuntimeSnapshot('llava:7b')).resolves.toEqual({
      daemonReachable: true,
      modelListAvailable: true,
      models: [{ id: 'qwen2.5:7b' }, { id: 'llava:7b' }],
      selectedModelId: 'llava:7b',
      selectedModelInstalled: true,
      selectedModelReady: true,
      selectedModelVisionSupport: 'supported',
      notice: null,
    })
  })

  it('reports when no models are installed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            models: [],
          }),
          { status: 200 },
        ),
      ),
    )

    await expect(getRuntimeSnapshot(null)).resolves.toMatchObject({
      daemonReachable: true,
      modelListAvailable: true,
      models: [],
      notice: 'No models are installed in Ollama.',
    })
  })

  it('reports when the selected model is missing from the discovered list', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            models: [{ model: 'qwen2.5:7b' }],
          }),
          { status: 200 },
        ),
      ),
    )

    await expect(getRuntimeSnapshot('missing-model')).resolves.toMatchObject({
      daemonReachable: true,
      modelListAvailable: true,
      selectedModelInstalled: false,
      selectedModelReady: false,
      notice: 'Selected model "missing-model" is not installed in Ollama.',
    })
  })

  it('distinguishes a reachable daemon from an unavailable model list', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('boom', { status: 500 })))

    await expect(getRuntimeSnapshot('qwen2.5:7b')).resolves.toMatchObject({
      daemonReachable: true,
      modelListAvailable: false,
      notice: 'Ollama is reachable, but the installed model list could not be loaded.',
    })
  })

  it('marks vision support as unsupported when capabilities are explicit and omit vision', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            models: [{ model: 'qwen2.5:7b' }],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            capabilities: ['completion'],
          }),
          { status: 200 },
        ),
      )

    vi.stubGlobal('fetch', fetchMock)

    await expect(getRuntimeSnapshot('qwen2.5:7b')).resolves.toMatchObject({
      selectedModelReady: true,
      selectedModelVisionSupport: 'unsupported',
    })
  })

  it('marks vision support as unknown when show data is non-decisive', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            models: [{ model: 'qwen2.5:7b' }],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            details: { family: 'qwen2.5' },
          }),
          { status: 200 },
        ),
      )

    vi.stubGlobal('fetch', fetchMock)

    await expect(getRuntimeSnapshot('qwen2.5:7b')).resolves.toMatchObject({
      selectedModelReady: true,
      selectedModelVisionSupport: 'unknown',
    })
  })

  it('marks selected model as not ready when runtime details cannot be loaded', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            models: [{ model: 'qwen2.5:7b' }],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response('boom', { status: 500 }))

    vi.stubGlobal('fetch', fetchMock)

    await expect(getRuntimeSnapshot('qwen2.5:7b')).resolves.toMatchObject({
      daemonReachable: true,
      modelListAvailable: true,
      selectedModelInstalled: true,
      selectedModelReady: false,
      selectedModelVisionSupport: 'unknown',
      notice: 'Selected model "qwen2.5:7b" is installed, but its runtime details could not be loaded.',
    })
  })
})
