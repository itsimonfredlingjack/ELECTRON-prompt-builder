import type { AppState } from '@/types'
import { DEFAULT_MODEL, MODEL_CAPABILITIES } from '@/lib/zai'

export const defaultAppState: AppState = {
  category: 'coding',
  model: DEFAULT_MODEL,
  models: MODEL_CAPABILITIES.map((model) => model.id),
  modelCapabilities: MODEL_CAPABILITIES,
  inputText: '',
  outputText: '',
  isStreaming: false,
  isGenerating: false,
  error: null,
  imageAttachment: null,
  uploadProgress: 0,
  uploadStatus: 'idle',
  uploadError: null,
}
