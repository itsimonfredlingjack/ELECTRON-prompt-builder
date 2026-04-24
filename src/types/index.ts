export type Category = 'coding' | 'analysis' | 'creative' | 'general'
export type PromptIntent = 'create' | 'analyze' | 'fix' | 'critique' | 'other'
export type PromptTarget = 'code' | 'analysis' | 'creative' | 'general'
export type PromptStrategy = 'balanced' | 'stricter' | 'structured' | 'system' | 'agentic'
export type WorkspaceTab = 'prompt' | 'compare' | 'variants' | 'history'
export type PromptVersionKind = 'initial' | 'variant' | 'refinement'

export type UploadStatus = 'idle' | 'validating' | 'ready' | 'uploading' | 'analyzing' | 'error'
export type VisionSupport = 'supported' | 'unsupported' | 'unknown'
export type GenerationLifecycleState =
  | 'idle'
  | 'preparing'
  | 'generating'
  | 'cancelling'
  | 'completed'
  | 'cancelled'
  | 'failed'

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

export interface DiscoveredModel {
  id: string
}

export interface OllamaRuntimeSnapshot {
  daemonReachable: boolean
  modelListAvailable: boolean
  models: DiscoveredModel[]
  selectedModelId: string | null
  selectedModelInstalled: boolean
  selectedModelReady: boolean
  selectedModelVisionSupport: VisionSupport
  notice: string | null
}

export interface RuntimeSnapshotRequest {
  selectedModelId: string | null
}

export interface UploadCandidate {
  name: string
  type: string
  size: number
  filePath: string
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

export interface StartGenerationRequest extends MultimodalGenerateRequest {
  requestId: string
}

export interface AiGenerationStart {
  requestId: string
}

export interface AiGenerationStartedEvent {
  requestId: string
  type: 'started'
  state: 'preparing' | 'generating'
}

export interface AiGenerationChunkEvent {
  requestId: string
  type: 'chunk'
  chunk: string
}

export interface AiGenerationCompletedEvent {
  requestId: string
  type: 'completed'
}

export interface AiGenerationCancelledEvent {
  requestId: string
  type: 'cancelled'
}

export interface AiGenerationFailedEvent {
  requestId: string
  type: 'failed'
  error: AppError
}

export interface PromptVersion {
  id: string
  title: string
  promptText: string
  sourceValue: string
  briefText: string
  contextText: string
  mustInclude: string
  mustAvoid: string
  outputShape: string
  referenceMaterial: string
  extraConstraints: string[]
  hasImageAttachment: boolean
  category: Category
  promptIntent: PromptIntent
  promptTarget: PromptTarget
  promptStrategy: PromptStrategy
  kind: PromptVersionKind
  parentVersionId: string | null
  requestLabel: string | null
  createdAt: string
  saved: boolean
}

export interface PromptInsight {
  id: string
  label: string
  detail: string
  tone: 'neutral' | 'strong' | 'caution'
}

export interface PromptMissingDetail {
  id: string
  label: string
  detail: string
  severity: 'info' | 'warning'
}

export type AiGenerationEvent =
  | AiGenerationStartedEvent
  | AiGenerationChunkEvent
  | AiGenerationCompletedEvent
  | AiGenerationCancelledEvent
  | AiGenerationFailedEvent
