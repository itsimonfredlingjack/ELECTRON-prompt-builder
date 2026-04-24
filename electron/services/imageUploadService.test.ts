import fs from 'fs'
import { promises as fsp } from 'fs'
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
  clearPreparedImage,
  consumePreparedImage,
  detectMimeType,
  normalizeMimeType,
  prepareImageUpload,
} from './imageUploadService'

const TINY_PNG_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47,
  0x0d, 0x0a, 0x1a, 0x0a,
])

async function writeFixtureFile(fileName: string, bytes: Buffer): Promise<string> {
  const filePath = path.join(tempRoot, fileName)
  await fsp.writeFile(filePath, bytes)
  return filePath
}

describe('image upload mime detection', () => {
  it('detects PNG images from magic bytes', () => {
    expect(detectMimeType(TINY_PNG_BYTES)).toBe('image/png')
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

  it('prepares an image successfully from a native file path', async () => {
    const filePath = await writeFixtureFile('tiny-success.png', TINY_PNG_BYTES)

    const prepared = await prepareImageUpload({
      name: 'tiny-success.png',
      type: 'image/png',
      size: TINY_PNG_BYTES.length,
      filePath,
    })

    expect(prepared.mimeType).toBe('image/png')
    expect(prepared.size).toBe(TINY_PNG_BYTES.length)

    await expect(consumePreparedImage(prepared.tempId)).resolves.toMatchObject({
      mimeType: 'image/png',
      size: TINY_PNG_BYTES.length,
    })
  })

  it('clears a prepared image successfully', async () => {
    const filePath = await writeFixtureFile('tiny-remove.png', TINY_PNG_BYTES)

    const prepared = await prepareImageUpload({
      name: 'tiny-remove.png',
      type: 'image/png',
      size: TINY_PNG_BYTES.length,
      filePath,
    })

    await clearPreparedImage(prepared.tempId)

    await expect(consumePreparedImage(prepared.tempId)).rejects.toMatchObject({
      code: 'INVALID_UPLOAD',
    })
  })

  it('rejects invalid file content safely even when declared as image/png', async () => {
    const invalidBytes = Buffer.from('not an image', 'utf8')
    const filePath = await writeFixtureFile('invalid-payload.png', invalidBytes)

    await expect(
      prepareImageUpload({
        name: 'invalid-payload.png',
        type: 'image/png',
        size: invalidBytes.length,
        filePath,
      }),
    ).rejects.toMatchObject({
      code: 'UNSUPPORTED_FILE_TYPE',
    })
  })

  it('rejects expired prepared images instead of keeping them for the full app session', async () => {
    const filePath = await writeFixtureFile('tiny-expiring.png', TINY_PNG_BYTES)

    const prepared = await prepareImageUpload({
      name: 'tiny-expiring.png',
      type: 'image/png',
      size: TINY_PNG_BYTES.length,
      filePath,
    })

    vi.setSystemTime(new Date(prepared.expiresAt).getTime() + 1)

    await expect(consumePreparedImage(prepared.tempId)).rejects.toMatchObject({
      code: 'INVALID_UPLOAD',
    })
  })

  it('can clear every prepared image for the active session in one pass', async () => {
    const filePath = await writeFixtureFile('tiny-clear-all.png', TINY_PNG_BYTES)

    const prepared = await prepareImageUpload({
      name: 'tiny-clear-all.png',
      type: 'image/png',
      size: TINY_PNG_BYTES.length,
      filePath,
    })

    await clearAllPreparedImages()

    await expect(consumePreparedImage(prepared.tempId)).rejects.toMatchObject({
      code: 'INVALID_UPLOAD',
    })
  })
})
