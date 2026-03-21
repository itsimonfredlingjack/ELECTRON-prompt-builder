import type { ModelCapability } from '../types/index.js'

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024

export const MODEL_CAPABILITIES: ModelCapability[] = [
  {
    id: 'qwen3.5:4b',
    label: 'Qwen 3.5 4B',
    provider: 'ollama',
    supportsImages: true,
    maxImageBytes: MAX_IMAGE_BYTES,
  },
]

export const DEFAULT_MODEL = 'qwen3.5:4b'

export function getModelCapability(modelId: string): ModelCapability | undefined {
  return MODEL_CAPABILITIES.find((model) => model.id === modelId)
}

export function getFirstVisionModel(): ModelCapability | undefined {
  return MODEL_CAPABILITIES.find((model) => model.supportsImages)
}

export function supportsImages(modelId: string): boolean {
  return getModelCapability(modelId)?.supportsImages ?? false
}
