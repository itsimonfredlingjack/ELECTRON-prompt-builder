import electron = require('electron')
import type {
  AiGenerationEvent,
  AiGenerationStart,
  ConnectionCheckRequest,
  ModelCapability,
  MultimodalGenerateRequest,
  PreparedImage,
  UploadCandidate,
} from '../src/types/index'

const { contextBridge, ipcRenderer } = electron

contextBridge.exposeInMainWorld('electronAPI', {
  clipboardWrite: (text: string): Promise<boolean> => ipcRenderer.invoke('clipboard:write', text),
  windowMinimize: () => ipcRenderer.invoke('window:minimize'),
  windowToggleMaximize: () => ipcRenderer.invoke('window:toggleMaximize'),
  windowClose: () => ipcRenderer.invoke('window:close'),
  windowIsMaximized: (): Promise<boolean> => ipcRenderer.invoke('window:isMaximized'),

  onWindowStateChange: (callback: (state: { isMaximized: boolean }) => void) => {
    const handler = (_event: unknown, state: { isMaximized: boolean }) => {
      callback(state)
    }
    ipcRenderer.on('window:state-change', handler)
    return () => ipcRenderer.removeListener('window:state-change', handler)
  },

  getModelCapabilities: (): Promise<ModelCapability[]> => ipcRenderer.invoke('ai:getModelCapabilities'),
  checkConnection: (request: ConnectionCheckRequest): Promise<boolean> => ipcRenderer.invoke('ai:checkConnection', request),
  prepareImageUpload: (file: UploadCandidate): Promise<PreparedImage> => ipcRenderer.invoke('ai:prepareImageUpload', file),
  clearPreparedImage: (tempId: string): Promise<void> => ipcRenderer.invoke('ai:clearPreparedImage', tempId),
  startGeneration: (request: MultimodalGenerateRequest): Promise<AiGenerationStart> =>
    ipcRenderer.invoke('ai:startGeneration', request),
  cancelGeneration: (requestId: string): Promise<void> => ipcRenderer.invoke('ai:cancelGeneration', requestId),
  onGenerationEvent: (callback: (event: AiGenerationEvent) => void) => {
    const handler = (_event: unknown, event: AiGenerationEvent) => {
      callback(event)
    }
    ipcRenderer.on('ai:generation-event', handler)
    return () => ipcRenderer.removeListener('ai:generation-event', handler)
  },
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke('external:open', url),
})
