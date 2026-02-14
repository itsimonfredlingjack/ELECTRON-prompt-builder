/// <reference types="vite/client" />

interface WindowState {
  isMaximized: boolean
}

interface ElectronAPI {
  clipboardWrite: (text: string) => void
  windowMinimize: () => Promise<void>
  windowToggleMaximize: () => Promise<void>
  windowClose: () => Promise<void>
  windowIsMaximized: () => Promise<boolean>
  onWindowStateChange: (callback: (state: WindowState) => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
