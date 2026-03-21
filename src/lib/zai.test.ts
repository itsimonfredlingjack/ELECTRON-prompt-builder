import { describe, expect, it } from 'vitest'
import { DEFAULT_MODEL, MODEL_CAPABILITIES } from '@/shared/models'
import { MAX_IMAGE_BYTES, toAppError, validateSelectedImage } from '@/lib/zai'

describe('model catalog', () => {
  it('exposes only local Ollama models', () => {
    expect(MODEL_CAPABILITIES).toEqual([
      expect.objectContaining({
        id: 'qwen3.5:4b',
        label: 'Qwen 3.5 4B',
        provider: 'ollama',
        supportsImages: true,
      }),
    ])
  })

  it('defaults to the local Qwen model', () => {
    expect(DEFAULT_MODEL).toBe('qwen3.5:4b')
  })
})

describe('validateSelectedImage', () => {
  it('accepts a supported image for the local Qwen model', () => {
    const file = new File(['hello'], 'diagram.png', { type: 'image/png' })
    expect(validateSelectedImage(file, 'qwen3.5:4b')).toBeNull()
  })

  it('rejects unsupported mime types', () => {
    const file = new File(['hello'], 'note.txt', { type: 'text/plain' })
    expect(validateSelectedImage(file, 'qwen3.5:4b')).toEqual(toAppError('UNSUPPORTED_FILE_TYPE'))
  })

  it('rejects files that are too large', () => {
    const oversized = new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], 'big.png', { type: 'image/png' })
    expect(validateSelectedImage(oversized, 'qwen3.5:4b')).toEqual(toAppError('FILE_TOO_LARGE'))
  })

  it('rejects image analysis on an unknown model', () => {
    const file = new File(['hello'], 'diagram.png', { type: 'image/png' })
    expect(validateSelectedImage(file, 'missing-model')).toEqual(toAppError('MODEL_NOT_SUPPORTED'))
  })
})
