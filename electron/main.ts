import electron from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'
import type { BrowserWindow as BrowserWindowType } from 'electron'
import type {
  AiGenerationEvent,
  ConnectionCheckRequest,
  MultimodalGenerateRequest,
  PreparedImage,
  UploadCandidate,
} from '../src/types/index.js'
import { MODEL_CAPABILITIES } from './utils/modelCapabilities.js'
import {
  cleanupExpiredUploads,
  clearAllPreparedImages,
  clearPreparedImage,
  ensureUploadDir,
  prepareImageUpload,
} from './services/imageUploadService.js'
import { cancelGeneration, checkConnection, startGeneration } from './services/zaiService.js'

const { app, BrowserWindow, clipboard, session, ipcMain, Menu, shell } = electron

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged
const devServerHost = process.env.DEV_SERVER_HOST ?? '127.0.0.1'
const parsedDevPort = Number.parseInt(process.env.DEV_SERVER_PORT ?? '5173', 10)
const devServerPort = Number.isNaN(parsedDevPort) ? 5173 : parsedDevPort
const devServerUrl = `http://${devServerHost}:${devServerPort}`
let mainWindow: BrowserWindowType | null = null
let isCleaningUpSessionUploads = false

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
      sandbox: true,
    },
    title: 'AI Prompt Builder',
    show: false,
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
    mainWindow.loadURL(devServerUrl)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../index.html'))
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

ipcMain.handle('ai:getModelCapabilities', async () => MODEL_CAPABILITIES)
ipcMain.handle('ai:checkConnection', async (_event, request: ConnectionCheckRequest) => checkConnection(request))
ipcMain.handle('ai:prepareImageUpload', async (_event, file: UploadCandidate): Promise<PreparedImage> => {
  return prepareImageUpload(file)
})
ipcMain.handle('ai:clearPreparedImage', async (_event, tempId: string): Promise<void> => {
  await clearPreparedImage(tempId)
})
ipcMain.handle('ai:startGeneration', async (_event, request: MultimodalGenerateRequest): Promise<{ requestId: string }> => {
  const requestId = crypto.randomUUID()
  setTimeout(() => {
    void startGeneration(requestId, request, emitGenerationEvent)
  }, 0)
  return { requestId }
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
              "style-src 'self' 'unsafe-inline'; " +
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
