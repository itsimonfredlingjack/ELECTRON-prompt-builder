import { contextBridge, clipboard, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  clipboardWrite: (text: string) => {
    clipboard.writeText(text)
  },
  windowMinimize: () => ipcRenderer.invoke('window:minimize'),
  windowMaximize: () => ipcRenderer.invoke('window:maximize'),
  windowClose: () => ipcRenderer.invoke('window:close'),
})
