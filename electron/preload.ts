import { contextBridge, clipboard, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  clipboardWrite: (text: string) => {
    clipboard.writeText(text)
  },
  
  windowMinimize: () => ipcRenderer.invoke('window:minimize'),
  windowToggleMaximize: () => ipcRenderer.invoke('window:toggleMaximize'),
  windowClose: () => ipcRenderer.invoke('window:close'),
  windowIsMaximized: (): Promise<boolean> => ipcRenderer.invoke('window:isMaximized'),
  
  onWindowStateChange: (callback: (state: { isMaximized: boolean }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, state: { isMaximized: boolean }) => {
      callback(state)
    }
    ipcRenderer.on('window:state-change', handler)
    return () => ipcRenderer.removeListener('window:state-change', handler)
  },

  getApiKey: (): Promise<string> => ipcRenderer.invoke('settings:getApiKey'),
  setApiKey: (key: string): Promise<void> => ipcRenderer.invoke('settings:setApiKey', key),
})
