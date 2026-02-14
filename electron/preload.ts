import { contextBridge, clipboard } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  clipboardWrite: (text: string) => {
    clipboard.writeText(text)
  }
})
