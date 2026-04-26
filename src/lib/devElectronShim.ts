/**
 * Dev-only shim: lets the renderer talk to local Ollama directly when running
 * in a plain browser (Vite dev server, Storybook, etc.) instead of via Electron
 * IPC. Stripped from production by `import.meta.env.DEV` guard at the call site.
 */
import type {
  AiGenerationEvent,
  AiGenerationStart,
  OllamaRuntimeSnapshot,
  PreparedImage,
  StartGenerationRequest,
  UploadCandidate,
} from '@/types'

const OLLAMA_BASE = 'http://127.0.0.1:11434'

type GenerationListener = (event: AiGenerationEvent) => void

export function installDevElectronShim() {
  if (typeof window === 'undefined') return
  if (window.electronAPI) return

  const generationListeners = new Set<GenerationListener>()
  const activeAborts = new Map<string, AbortController>()

  const dispatch = (event: AiGenerationEvent) => {
    generationListeners.forEach((listener) => {
      try {
        listener(event)
      } catch (error) {
        console.error('[dev-shim] listener error', error)
      }
    })
  }

  const fetchSnapshot = async (
    request: { selectedModelId: string | null },
  ): Promise<OllamaRuntimeSnapshot> => {
    try {
      const tagsRes = await fetch(`${OLLAMA_BASE}/api/tags`)
      if (!tagsRes.ok) {
        return offlineSnapshot(request.selectedModelId)
      }
      const payload = (await tagsRes.json()) as { models?: Array<{ name: string }> }
      const models = (payload.models ?? []).map((m) => ({ id: m.name }))
      const selectedModelId = request.selectedModelId ?? models[0]?.id ?? null
      const installed = !!selectedModelId && models.some((m) => m.id === selectedModelId)
      return {
        daemonReachable: true,
        modelListAvailable: true,
        models,
        selectedModelId,
        selectedModelInstalled: installed,
        selectedModelReady: installed,
        selectedModelVisionSupport: 'unknown',
        notice: '[dev shim] talking to Ollama directly — image attachments not supported in this mode.',
      }
    } catch {
      return offlineSnapshot(request.selectedModelId)
    }
  }

  const offlineSnapshot = (selectedModelId: string | null): OllamaRuntimeSnapshot => ({
    daemonReachable: false,
    modelListAvailable: false,
    models: [],
    selectedModelId,
    selectedModelInstalled: false,
    selectedModelReady: false,
    selectedModelVisionSupport: 'unknown',
    notice: null,
  })

  const startGeneration = async (
    request: StartGenerationRequest,
  ): Promise<AiGenerationStart> => {
    const { requestId, model, systemPrompt, userInput } = request
    const controller = new AbortController()
    activeAborts.set(requestId, controller)

    void (async () => {
      dispatch({ requestId, type: 'started', state: 'preparing' })
      try {
        const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            system: systemPrompt,
            prompt: userInput,
            stream: true,
          }),
          signal: controller.signal,
        })

        if (!res.ok || !res.body) {
          dispatch({
            requestId,
            type: 'failed',
            error: { code: 'AI_PROVIDER_ERROR', message: `Ollama returned ${res.status}` },
          })
          activeAborts.delete(requestId)
          return
        }

        dispatch({ requestId, type: 'started', state: 'generating' })

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          let newlineIndex = buffer.indexOf('\n')
          while (newlineIndex !== -1) {
            const line = buffer.slice(0, newlineIndex).trim()
            buffer = buffer.slice(newlineIndex + 1)
            if (line) {
              try {
                const json = JSON.parse(line) as {
                  response?: string
                  done?: boolean
                }
                if (json.response) {
                  dispatch({ requestId, type: 'chunk', chunk: json.response })
                }
                if (json.done) {
                  dispatch({ requestId, type: 'completed' })
                  activeAborts.delete(requestId)
                  return
                }
              } catch {
                // ignore malformed line
              }
            }
            newlineIndex = buffer.indexOf('\n')
          }
        }
        dispatch({ requestId, type: 'completed' })
        activeAborts.delete(requestId)
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          dispatch({ requestId, type: 'cancelled' })
        } else {
          dispatch({
            requestId,
            type: 'failed',
            error: { code: 'AI_PROVIDER_ERROR', message: (error as Error).message },
          })
        }
        activeAborts.delete(requestId)
      }
    })()

    return { requestId }
  }

  const noop = async () => undefined

  window.electronAPI = {
    clipboardWrite: async (text: string) => {
      try {
        await navigator.clipboard.writeText(text)
        return true
      } catch {
        return false
      }
    },
    windowMinimize: noop,
    windowToggleMaximize: noop,
    windowClose: noop,
    windowIsMaximized: async () => false,
    onWindowStateChange: () => () => undefined,
    getRuntimeSnapshot: fetchSnapshot,
    refreshRuntimeSnapshot: fetchSnapshot,
    startGeneration,
    cancelGeneration: async (requestId: string) => {
      const controller = activeAborts.get(requestId)
      if (controller) {
        controller.abort()
        activeAborts.delete(requestId)
      }
    },
    onGenerationEvent: (listener: GenerationListener) => {
      generationListeners.add(listener)
      return () => {
        generationListeners.delete(listener)
      }
    },
    prepareImageUpload: async (_candidate: UploadCandidate): Promise<PreparedImage> => {
      throw new Error('Image attachments not supported in dev shim. Run via electron:dev for full Vision flow.')
    },
    clearPreparedImage: async () => undefined,
    openExternal: async (url: string) => {
      window.open(url, '_blank', 'noopener,noreferrer')
    },
  }

  // eslint-disable-next-line no-console
  console.info('[dev-shim] electronAPI installed — talking to Ollama at', OLLAMA_BASE)
}
