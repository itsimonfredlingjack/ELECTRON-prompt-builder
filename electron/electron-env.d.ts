/// <reference types="vite/client" />

import type {
  AiGenerationEvent,
  AiGenerationStart,
  ConnectionCheckRequest,
  ModelCapability,
  MultimodalGenerateRequest,
  PreparedImage,
  UploadCandidate,
} from '../src/types'

interface WindowState {
  isMaximized: boolean
}

interface ElectronAPI {
  clipboardWrite: (text: string) => Promise<boolean>
  windowMinimize: () => Promise<void>
  windowToggleMaximize: () => Promise<void>
  windowClose: () => Promise<void>
  windowIsMaximized: () => Promise<boolean>
  onWindowStateChange: (callback: (state: WindowState) => void) => () => void
  getModelCapabilities: () => Promise<ModelCapability[]>
  checkConnection: (request: ConnectionCheckRequest) => Promise<boolean>
  prepareImageUpload: (file: UploadCandidate) => Promise<PreparedImage>
  clearPreparedImage: (tempId: string) => Promise<void>
  startGeneration: (request: MultimodalGenerateRequest) => Promise<AiGenerationStart>
  cancelGeneration: (requestId: string) => Promise<void>
  onGenerationEvent: (callback: (event: AiGenerationEvent) => void) => () => void
  openExternal: (url: string) => Promise<void>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
