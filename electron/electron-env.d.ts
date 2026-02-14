/// <reference types="vite/client" />

interface ElectronAPI {
  clipboardWrite: (text: string) => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
