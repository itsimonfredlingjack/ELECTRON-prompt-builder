import electron from 'electron'
import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'
import type { AppError, PreparedImage, UploadCandidate } from '../../src/types/index.js'
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_BYTES,
  PREPARE_UPLOAD_TIMEOUT_MS,
  type AllowedImageMimeType,
  UPLOAD_TTL_MS,
} from '../utils/uploadConstants.js'

const { app } = electron

interface StoredUpload {
  filePath: string
  mimeType: AllowedImageMimeType
  size: number
  expiresAt: string
}

const uploadRegistry = new Map<string, StoredUpload>()

function getUploadDir(): string {
  return path.join(app.getPath('temp'), 'ai-prompt-builder-uploads')
}

export async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(getUploadDir(), { recursive: true })
}

export async function cleanupExpiredUploads(): Promise<void> {
  await ensureUploadDir()
  const now = Date.now()
  const uploadDir = getUploadDir()
  const files = await fs.readdir(uploadDir).catch(() => [])

  await Promise.all(
    files.map(async (fileName) => {
      const filePath = path.join(uploadDir, fileName)
      const stat = await fs.stat(filePath).catch(() => null)
      if (!stat) return
      if (now - stat.mtimeMs > UPLOAD_TTL_MS) {
        await fs.rm(filePath, { force: true }).catch(() => undefined)
      }
    }),
  )
}

export async function prepareImageUpload(candidate: UploadCandidate): Promise<PreparedImage> {
  return withTimeout(async () => {
    await ensureUploadDir()

    if (!candidate?.dataBase64 || !candidate.name || !candidate.type) {
      throw appError('INVALID_UPLOAD')
    }

    const normalizedDeclaredType = normalizeMimeType(candidate.type)
    if (!normalizedDeclaredType) {
      throw appError('UNSUPPORTED_FILE_TYPE')
    }

    if (candidate.size > MAX_IMAGE_BYTES) {
      throw appError('FILE_TOO_LARGE')
    }

    const buffer = Buffer.from(candidate.dataBase64, 'base64')
    if (buffer.length !== candidate.size) {
      throw appError('INVALID_UPLOAD', 'The prepared image size did not match the selected file.')
    }

    const detectedMimeType = detectMimeType(buffer)
    if (!detectedMimeType) {
      throw appError('UNSUPPORTED_FILE_TYPE')
    }

    if (detectedMimeType !== normalizedDeclaredType) {
      throw appError('MIME_MISMATCH')
    }

    const tempId = crypto.randomUUID()
    const fileExtension = extensionForMimeType(detectedMimeType)
    const filePath = path.join(getUploadDir(), `upload_${tempId}.${fileExtension}`)
    const expiresAt = new Date(Date.now() + UPLOAD_TTL_MS).toISOString()

    await fs.writeFile(filePath, buffer)

    uploadRegistry.set(tempId, {
      filePath,
      mimeType: detectedMimeType,
      size: buffer.length,
      expiresAt,
    })

    return {
      tempId,
      mimeType: detectedMimeType,
      size: buffer.length,
      maxBytes: MAX_IMAGE_BYTES,
      expiresAt,
    }
  }, PREPARE_UPLOAD_TIMEOUT_MS)
}

export async function clearPreparedImage(tempId: string): Promise<void> {
  const upload = uploadRegistry.get(tempId)
  uploadRegistry.delete(tempId)

  if (!upload) return
  await fs.rm(upload.filePath, { force: true }).catch(() => undefined)
}

export async function clearAllPreparedImages(): Promise<void> {
  const uploads = Array.from(uploadRegistry.values())
  uploadRegistry.clear()

  await Promise.all(
    uploads.map((upload) => fs.rm(upload.filePath, { force: true }).catch(() => undefined)),
  )
}

export async function consumePreparedImage(tempId: string): Promise<StoredUpload> {
  const upload = uploadRegistry.get(tempId)
  if (!upload) {
    throw appError('INVALID_UPLOAD', 'The selected image expired or could not be found.')
  }

  if (hasUploadExpired(upload.expiresAt)) {
    uploadRegistry.delete(tempId)
    await fs.rm(upload.filePath, { force: true }).catch(() => undefined)
    throw appError('INVALID_UPLOAD', 'The selected image expired or could not be found.')
  }

  return upload
}

export async function readPreparedImageAsDataUrl(tempId: string): Promise<string> {
  const upload = await consumePreparedImage(tempId)
  const fileBuffer = await fs.readFile(upload.filePath)
  return `data:${upload.mimeType};base64,${fileBuffer.toString('base64')}`
}

export function appError(code: AppError['code'], message?: string): AppError {
  return { code, message: message ?? code }
}

export function normalizeMimeType(value: string): AllowedImageMimeType | null {
  const normalized = value.toLowerCase()
  if (normalized === 'image/jpg') return 'image/jpeg'
  if (ALLOWED_IMAGE_MIME_TYPES.includes(normalized as AllowedImageMimeType)) {
    return normalized as AllowedImageMimeType
  }
  return null
}

function extensionForMimeType(mimeType: AllowedImageMimeType): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    case 'image/gif':
      return 'gif'
  }
}

export function detectMimeType(buffer: Buffer): AllowedImageMimeType | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg'
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png'
  }

  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp'
  }

  if (buffer.length >= 6) {
    const header = buffer.toString('ascii', 0, 6)
    if (header === 'GIF87a' || header === 'GIF89a') {
      return 'image/gif'
    }
  }

  return null
}

export function hasUploadExpired(expiresAt: string, now = Date.now()): boolean {
  const expiresAtMs = new Date(expiresAt).getTime()
  if (Number.isNaN(expiresAtMs)) return true
  return expiresAtMs <= now
}

async function withTimeout<T>(callback: () => Promise<T>, timeoutMs: number): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await Promise.race([
      callback(),
      new Promise<T>((_, reject) => {
        controller.signal.addEventListener('abort', () => reject(appError('UPLOAD_TIMEOUT')))
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}
