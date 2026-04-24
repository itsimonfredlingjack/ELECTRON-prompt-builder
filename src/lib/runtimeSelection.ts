import type { OllamaRuntimeSnapshot } from '@/types'

interface RuntimeSelectionResolution {
  nextModelId: string | null
  notice: string | null
  needsReload: boolean
}

export function resolveRuntimeSelection(
  currentModelId: string | null,
  snapshot: OllamaRuntimeSnapshot,
): RuntimeSelectionResolution {
  const discoveredModelIds = snapshot.models.map((model) => model.id)

  if (!snapshot.modelListAvailable || discoveredModelIds.length === 0) {
    return {
      nextModelId: currentModelId,
      notice: snapshot.notice,
      needsReload: false,
    }
  }

  if (!currentModelId) {
    return {
      nextModelId: discoveredModelIds[0] ?? null,
      notice: null,
      needsReload: true,
    }
  }

  if (!snapshot.selectedModelInstalled) {
    const fallbackModelId = discoveredModelIds[0] ?? null
    return {
      nextModelId: fallbackModelId,
      notice: fallbackModelId
        ? `Selected model "${currentModelId}" is no longer installed. Switched to "${fallbackModelId}".`
        : snapshot.notice,
      needsReload: true,
    }
  }

  return {
    nextModelId: currentModelId,
    notice: snapshot.notice,
    needsReload: false,
  }
}
