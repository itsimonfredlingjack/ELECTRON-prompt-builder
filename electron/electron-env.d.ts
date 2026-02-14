/// <reference types="vite/client" />

interface ElectronAPI {
  clipboardWrite: (text: string) => void
  windowMinimize: () => Promise<void>
  windowMaximize: () => Promise<void>
  windowClose: () => Promise<void>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
