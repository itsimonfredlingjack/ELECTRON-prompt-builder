import { app, BrowserWindow, session, ipcMain, Menu, safeStorage, shell } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import Store from 'electron-store'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

type AnalyticsMeta = Record<string, string>

interface AnalyticsEvent {
  name: string
  ts: string
  meta: AnalyticsMeta
}

interface AppStoreSchema {
  apiKeyEnc?: string
  analyticsEvents?: AnalyticsEvent[]
  analyticsCounters?: Record<string, number>
}

const store = new Store<AppStoreSchema>()

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

if (process.argv.includes('--disable-gpu') || process.env.DISABLE_GPU) {
  app.disableHardwareAcceleration()
}

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 850,
    minWidth: 900,
    minHeight: 700,
    frame: false,
    resizable: true,
    maximizable: true,
    fullscreenable: true,
    backgroundColor: '#0c0e14',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      sandbox: true
    },
    title: 'AI Prompt Builder',
    show: false
  })

  Menu.setApplicationMenu(null)

  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window:state-change', { isMaximized: true })
  })

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window:state-change', { isMaximized: false })
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../index.html'))
  }
}

ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize()
})

ipcMain.handle('window:toggleMaximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})

ipcMain.handle('window:isMaximized', () => {
  return mainWindow?.isMaximized() ?? false
})

ipcMain.handle('window:close', () => {
  mainWindow?.close()
})

ipcMain.handle('settings:getApiKey', async (): Promise<string> => {
  const enc = store.get('apiKeyEnc')
  if (!enc) return ''
  try {
    const buf = Buffer.from(enc, 'base64')
    return safeStorage.decryptString(buf)
  } catch {
    return ''
  }
})

ipcMain.handle('settings:setApiKey', async (_event, key: string): Promise<void> => {
  if (!key?.trim()) {
    store.delete('apiKeyEnc')
    return
  }
  const buf = safeStorage.encryptString(key.trim())
  store.set('apiKeyEnc', buf.toString('base64'))
})

ipcMain.handle('external:open', async (_event, url: string): Promise<void> => {
  if (!url?.trim()) {
    throw new Error('URL is required')
  }

  const parsed = new URL(url)
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('Only HTTP(S) URLs are allowed')
  }

  await shell.openExternal(parsed.toString())
})

ipcMain.handle('analytics:track', async (_event, name: string, meta?: Record<string, string>): Promise<void> => {
  if (!/^[a-z0-9_]{1,64}$/.test(name)) {
    throw new Error('Invalid event name')
  }

  const cleanMeta: AnalyticsMeta = {}
  if (meta) {
    for (const [key, value] of Object.entries(meta)) {
      if (/^[a-z0-9_]{1,32}$/.test(key) && typeof value === 'string') {
        cleanMeta[key] = value.slice(0, 120)
      }
    }
  }

  const previousEvents = store.get('analyticsEvents') ?? []
  const nextEvent: AnalyticsEvent = {
    name,
    ts: new Date().toISOString(),
    meta: cleanMeta,
  }
  store.set('analyticsEvents', [...previousEvents, nextEvent].slice(-200))

  const counters = store.get('analyticsCounters') ?? {}
  counters[name] = (counters[name] ?? 0) + 1
  store.set('analyticsCounters', counters)
})

app.whenReady().then(() => {
  if (!isDev) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self'; " +
            "script-src 'self'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: https:; " +
            "connect-src 'self' https://api.z.ai"
          ]
        }
      })
    })
  }

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
