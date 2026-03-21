import { MAX_IMAGE_BYTES } from '../../src/shared/models.js'

export { MAX_IMAGE_BYTES }
export const UPLOAD_TTL_MS = 30 * 60 * 1000
export const PREPARE_UPLOAD_TIMEOUT_MS = 15_000
export const GENERATION_TIMEOUT_MS = 90_000

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number]
