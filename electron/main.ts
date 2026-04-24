import electron from 'electron'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import type { BrowserWindow as BrowserWindowType } from 'electron'
import type {
  AiGenerationEvent,
  AiGenerationStart,
  PreparedImage,
  RuntimeSnapshotRequest,
  StartGenerationRequest,
  UploadCandidate,
} from '../src/types/index.js'
import {
  cleanupExpiredUploads,
  clearAllPreparedImages,
  clearPreparedImage,
  ensureUploadDir,
  prepareImageUpload,
} from './services/imageUploadService.js'
import { cancelGeneration, startGeneration } from './services/ollamaGenerationService.js'
import { getRuntimeSnapshot } from './services/ollamaRuntimeService.js'

const { app, BrowserWindow, clipboard, session, ipcMain, Menu, shell } = electron

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged
const devServerHost = process.env.DEV_SERVER_HOST ?? '127.0.0.1'
const parsedDevPort = Number.parseInt(process.env.DEV_SERVER_PORT ?? '5173', 10)
const devServerPort = Number.isNaN(parsedDevPort) ? 5173 : parsedDevPort
const devServerUrl = `http://${devServerHost}:${devServerPort}`
const packagedRendererPath = path.join(__dirname, '../../index.html')
const packagedRendererUrl = pathToFileURL(packagedRendererPath).toString()
let mainWindow: BrowserWindowType | null = null
let isCleaningUpSessionUploads = false

function isAllowedAppNavigation(url: string): boolean {
  try {
    const parsed = new URL(url)

    if (isDev) {
      return parsed.origin === new URL(devServerUrl).origin
    }

    return parsed.toString() === packagedRendererUrl
  } catch {
    return false
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 850,
    minWidth: 900,
    minHeight: 700,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 14 },
    resizable: true,
    maximizable: true,
    fullscreenable: true,
    backgroundColor: '#0D0D0F',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      sandbox: true,
    },
    title: 'AI Prompt Builder',
    show: false,
  })

  Menu.setApplicationMenu(null)

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedAppNavigation(url)) {
      event.preventDefault()
    }
  })

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
    mainWindow.loadURL(devServerUrl)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(packagedRendererPath)
  }
}

function emitGenerationEvent(event: AiGenerationEvent): void {
  mainWindow?.webContents.send('ai:generation-event', event)
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

ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false)
ipcMain.handle('window:close', () => {
  mainWindow?.close()
})

ipcMain.handle('clipboard:write', async (_event, text: string): Promise<boolean> => {
  if (!text) return false
  try {
    clipboard.writeText(text)
    return true
  } catch {
    return false
  }
})

ipcMain.handle('ai:getRuntimeSnapshot', async (_event, request: RuntimeSnapshotRequest) => getRuntimeSnapshot(request.selectedModelId))
ipcMain.handle('ai:refreshRuntimeSnapshot', async (_event, request: RuntimeSnapshotRequest) =>
  getRuntimeSnapshot(request.selectedModelId),
)
ipcMain.handle('ai:prepareImageUpload', async (_event, file: UploadCandidate): Promise<PreparedImage> => {
  return prepareImageUpload(file)
})
ipcMain.handle('ai:clearPreparedImage', async (_event, tempId: string): Promise<void> => {
  await clearPreparedImage(tempId)
})
ipcMain.handle('ai:startGeneration', async (_event, request: StartGenerationRequest): Promise<AiGenerationStart> => {
  void startGeneration(request, emitGenerationEvent)
  return { requestId: request.requestId }
})
ipcMain.handle('ai:cancelGeneration', async (_event, requestId: string): Promise<void> => {
  cancelGeneration(requestId)
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

app.whenReady().then(async () => {
  await ensureUploadDir()
  await cleanupExpiredUploads()

  if (!isDev) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self'; " +
              "script-src 'self'; " +
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
              "font-src 'self' https://fonts.gstatic.com; " +
              "img-src 'self' data: https: blob:; " +
              "connect-src 'self' http://127.0.0.1:11434",
          ],
        },
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

app.on('before-quit', (event) => {
  if (isCleaningUpSessionUploads) {
    return
  }

  isCleaningUpSessionUploads = true
  event.preventDefault()
  void clearAllPreparedImages().finally(() => {
    app.quit()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
