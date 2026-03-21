import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'prompt-builder-image-tests-'))

vi.mock('electron', () => ({
  default: {
    app: {
      getPath: () => tempRoot,
    },
  },
}))

import {
  clearAllPreparedImages,
  consumePreparedImage,
  detectMimeType,
  normalizeMimeType,
  prepareImageUpload,
} from './imageUploadService'

function createTinyPngBase64(): string {
  const png = Buffer.from([
    0x89, 0x50, 0x4e, 0x47,
    0x0d, 0x0a, 0x1a, 0x0a,
  ])
  return png.toString('base64')
}

describe('image upload mime detection', () => {
  it('detects PNG images from magic bytes', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    expect(detectMimeType(png)).toBe('image/png')
  })

  it('detects WEBP images from RIFF/WEBP headers', () => {
    const webp = Buffer.from('RIFF1234WEBP', 'ascii')
    expect(detectMimeType(webp)).toBe('image/webp')
  })

  it('normalizes image/jpg to image/jpeg', () => {
    expect(normalizeMimeType('image/jpg')).toBe('image/jpeg')
  })

  it('returns null for unsupported mime types', () => {
    expect(normalizeMimeType('application/pdf')).toBeNull()
  })
})

describe('prepared image lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(async () => {
    vi.useRealTimers()
    await clearAllPreparedImages()
  })

  it('rejects expired prepared images instead of keeping them for the full app session', async () => {
    const prepared = await prepareImageUpload({
      name: 'tiny.png',
      type: 'image/png',
      size: 8,
      dataBase64: createTinyPngBase64(),
    })

    vi.setSystemTime(new Date(prepared.expiresAt).getTime() + 1)

    await expect(consumePreparedImage(prepared.tempId)).rejects.toMatchObject({
      code: 'INVALID_UPLOAD',
    })
  })

  it('can clear every prepared image for the active session in one pass', async () => {
    const prepared = await prepareImageUpload({
      name: 'tiny.png',
      type: 'image/png',
      size: 8,
      dataBase64: createTinyPngBase64(),
    })

    await clearAllPreparedImages()

    await expect(consumePreparedImage(prepared.tempId)).rejects.toMatchObject({
      code: 'INVALID_UPLOAD',
    })
  })
})
