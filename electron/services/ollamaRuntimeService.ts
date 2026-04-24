import type { DiscoveredModel, OllamaRuntimeSnapshot } from '../../src/types/index.js'

const OLLAMA_API_BASE = 'http://127.0.0.1:11434'

interface TagsResponse {
  models?: Array<{
    name?: string
    model?: string
  }>
}

interface ShowResponse {
  capabilities?: unknown
}

export async function getRuntimeSnapshot(selectedModelId: string | null): Promise<OllamaRuntimeSnapshot> {
  const tagsResult = await fetchInstalledModels()

  if (!tagsResult.daemonReachable) {
    return {
      daemonReachable: false,
      modelListAvailable: false,
      models: [],
      selectedModelId,
      selectedModelInstalled: false,
      selectedModelReady: false,
      selectedModelVisionSupport: 'unknown',
      notice: 'Ollama daemon is not reachable.',
    }
  }

  if (!tagsResult.modelListAvailable) {
    return {
      daemonReachable: true,
      modelListAvailable: false,
      models: [],
      selectedModelId,
      selectedModelInstalled: false,
      selectedModelReady: false,
      selectedModelVisionSupport: 'unknown',
      notice: 'Ollama is reachable, but the installed model list could not be loaded.',
    }
  }

  const models = tagsResult.models
  const selectedModelInstalled = !!selectedModelId && models.some((model) => model.id === selectedModelId)

  if (models.length === 0) {
    return {
      daemonReachable: true,
      modelListAvailable: true,
      models,
      selectedModelId,
      selectedModelInstalled: false,
      selectedModelReady: false,
      selectedModelVisionSupport: 'unknown',
      notice: 'No models are installed in Ollama.',
    }
  }

  if (!selectedModelId) {
    return {
      daemonReachable: true,
      modelListAvailable: true,
      models,
      selectedModelId: null,
      selectedModelInstalled: false,
      selectedModelReady: false,
      selectedModelVisionSupport: 'unknown',
      notice: null,
    }
  }

  if (!selectedModelInstalled) {
    return {
      daemonReachable: true,
      modelListAvailable: true,
      models,
      selectedModelId,
      selectedModelInstalled: false,
      selectedModelReady: false,
      selectedModelVisionSupport: 'unknown',
      notice: `Selected model "${selectedModelId}" is not installed in Ollama.`,
    }
  }

  const details = await fetchModelDetails(selectedModelId)
  const selectedModelReady = details.ok

  return {
    daemonReachable: true,
    modelListAvailable: true,
    models,
    selectedModelId,
    selectedModelInstalled: true,
    selectedModelReady,
    selectedModelVisionSupport: details.visionSupport,
    notice: selectedModelReady
      ? null
      : `Selected model "${selectedModelId}" is installed, but its runtime details could not be loaded.`,
  }
}

async function fetchInstalledModels(): Promise<{
  daemonReachable: boolean
  modelListAvailable: boolean
  models: DiscoveredModel[]
}> {
  try {
    const response = await fetch(`${OLLAMA_API_BASE}/api/tags`)
    if (!response.ok) {
      return {
        daemonReachable: true,
        modelListAvailable: false,
        models: [],
      }
    }

    const payload = (await response.json().catch(() => null)) as TagsResponse | null
    if (!payload || !Array.isArray(payload.models)) {
      return {
        daemonReachable: true,
        modelListAvailable: false,
        models: [],
      }
    }

    const models = payload.models
      .map((model) => model.model || model.name)
      .filter((modelId): modelId is string => !!modelId?.trim())
      .map((modelId) => ({ id: modelId }))

    return {
      daemonReachable: true,
      modelListAvailable: true,
      models,
    }
  } catch {
    return {
      daemonReachable: false,
      modelListAvailable: false,
      models: [],
    }
  }
}

async function fetchModelDetails(modelId: string): Promise<{
  ok: boolean
  visionSupport: OllamaRuntimeSnapshot['selectedModelVisionSupport']
}> {
  try {
    const response = await fetch(`${OLLAMA_API_BASE}/api/show`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: modelId }),
    })

    if (!response.ok) {
      return { ok: false, visionSupport: 'unknown' }
    }

    const payload = (await response.json().catch(() => null)) as ShowResponse | null
    return {
      ok: true,
      visionSupport: deriveVisionSupport(payload),
    }
  } catch {
    return {
      ok: false,
      visionSupport: 'unknown',
    }
  }
}

function deriveVisionSupport(payload: ShowResponse | null): OllamaRuntimeSnapshot['selectedModelVisionSupport'] {
  const capabilities = payload?.capabilities
  if (!Array.isArray(capabilities)) {
    return 'unknown'
  }

  const normalized = capabilities
    .filter((capability): capability is string => typeof capability === 'string')
    .map((capability) => capability.toLowerCase())

  if (normalized.includes('vision')) {
    return 'supported'
  }

  return 'unsupported'
}
