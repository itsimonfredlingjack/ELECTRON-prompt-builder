import type { AppError, UploadErrorCode } from '@/types'
import {
  DEFAULT_MODEL,
  getFirstVisionModel,
  getModelCapability,
  MAX_IMAGE_BYTES,
  MODEL_CAPABILITIES,
  supportsImages,
} from '@/shared/models'

export const ACCEPTED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const

export type AcceptedImageMimeType = (typeof ACCEPTED_IMAGE_MIME_TYPES)[number]

const ERROR_MESSAGES: Record<UploadErrorCode, string> = {
  FILE_TOO_LARGE: `Image exceeds the ${formatBytes(MAX_IMAGE_BYTES)} limit.`,
  UNSUPPORTED_FILE_TYPE: 'Only JPG, PNG, WEBP, and GIF images are supported.',
  MIME_MISMATCH: 'The selected file does not match its declared image type.',
  UPLOAD_TIMEOUT: 'Image preparation timed out. Please try again.',
  NETWORK_ERROR: 'Cannot connect to local Ollama. Make sure Ollama is running.',
  MODEL_NOT_SUPPORTED: 'The selected model does not support image analysis.',
  AI_PROVIDER_ERROR: 'The model could not process the request. Please try again.',
  INVALID_UPLOAD: 'The selected file could not be prepared securely.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`
}

export function validateSelectedImage(file: File, modelId: string): AppError | null {
  if (!ACCEPTED_IMAGE_MIME_TYPES.includes(file.type as AcceptedImageMimeType)) {
    return toAppError('UNSUPPORTED_FILE_TYPE')
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return toAppError('FILE_TOO_LARGE')
  }

  if (!supportsImages(modelId)) {
    return toAppError('MODEL_NOT_SUPPORTED')
  }

  return null
}

export function toAppError(code: UploadErrorCode, fallbackMessage?: string): AppError {
  return {
    code,
    message: fallbackMessage?.trim() || ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN_ERROR,
  }
}

export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message
  }

  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return 'Generation stopped.'
    }

    if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
      return 'Cannot connect to local Ollama. Make sure Ollama is running.'
    }

    return error.message || ERROR_MESSAGES.UNKNOWN_ERROR
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR
}

function isAppError(value: unknown): value is AppError {
  return typeof value === 'object' && value !== null && 'code' in value && 'message' in value
}

export {
  DEFAULT_MODEL,
  getFirstVisionModel,
  getModelCapability,
  MAX_IMAGE_BYTES,
  MODEL_CAPABILITIES,
  supportsImages,
}
