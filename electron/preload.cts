import electron = require('electron')

const { contextBridge, clipboard, ipcRenderer } = electron

contextBridge.exposeInMainWorld('electronAPI', {
  clipboardWrite: (text: string) => {
    clipboard.writeText(text)
  },
  
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

  getApiKey: (): Promise<string> => ipcRenderer.invoke('settings:getApiKey'),
  setApiKey: (key: string): Promise<void> => ipcRenderer.invoke('settings:setApiKey', key),
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke('external:open', url),
  trackEvent: (name: string, meta?: Record<string, string>): Promise<void> =>
    ipcRenderer.invoke('analytics:track', name, meta),
})
