export type Category = 'coding' | 'analysis' | 'creative'
export type ModelProvider = 'ollama'

export type UploadStatus = 'idle' | 'validating' | 'ready' | 'uploading' | 'analyzing' | 'error'

export type UploadErrorCode =
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_FILE_TYPE'
  | 'MIME_MISMATCH'
  | 'UPLOAD_TIMEOUT'
  | 'NETWORK_ERROR'
  | 'MODEL_NOT_SUPPORTED'
  | 'AI_PROVIDER_ERROR'
  | 'INVALID_UPLOAD'
  | 'UNKNOWN_ERROR'

export interface ModelCapability {
  id: string
  label: string
  provider: ModelProvider
  supportsImages: boolean
  maxImageBytes: number
}

export interface ConnectionCheckRequest {
  model: string
}

export interface UploadCandidate {
  name: string
  type: string
  size: number
  dataBase64: string
}

export interface PreparedImage {
  tempId: string
  mimeType: string
  size: number
  maxBytes: number
  expiresAt: string
}

export interface ImageAttachment {
  name: string
  size: number
  mimeType: string
  previewUrl: string
  tempId: string | null
  prepared: boolean
}

export interface AppError {
  code: UploadErrorCode
  message: string
}

export interface MultimodalGenerateRequest {
  model: string
  systemPrompt: string
  userInput: string
  imageTempId?: string
}

export interface AiGenerationStart {
  requestId: string
}

export interface AiGenerationProgressEvent {
  requestId: string
  type: 'progress'
  stage: UploadStatus
  progress: number
  message: string
}

export interface AiGenerationChunkEvent {
  requestId: string
  type: 'chunk'
  chunk: string
}

export interface AiGenerationCompleteEvent {
  requestId: string
  type: 'complete'
}

export interface AiGenerationErrorEvent {
  requestId: string
  type: 'error'
  error: AppError
}

export type AiGenerationEvent =
  | AiGenerationProgressEvent
  | AiGenerationChunkEvent
  | AiGenerationCompleteEvent
  | AiGenerationErrorEvent

export interface AppState {
  category: Category
  model: string
  models: string[]
  modelCapabilities: ModelCapability[]
  inputText: string
  outputText: string
  lastGeneratedInputText: string
  lastGeneratedCategory: Category
  isStreaming: boolean
  isGenerating: boolean
  error: string | null
  imageAttachment: ImageAttachment | null
  uploadProgress: number
  uploadStatus: UploadStatus
  uploadError: AppError | null
}

export type SetAppState = React.Dispatch<React.SetStateAction<AppState>>

export interface AppContextValue {
  state: AppState
  setState: SetAppState
  ollamaConnected: boolean | null
  setOllamaConnected: (v: boolean | null) => void
}
