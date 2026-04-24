import { describe, expect, it } from 'vitest'
import { MAX_IMAGE_BYTES, toAppError, validateSelectedImage } from '@/lib/ollama'

describe('validateSelectedImage', () => {
  it('accepts a supported image when vision support is confirmed', () => {
    const file = new File(['hello'], 'diagram.png', { type: 'image/png' })
    expect(validateSelectedImage(file, 'supported')).toBeNull()
  })

  it('rejects image analysis when vision support is unknown', () => {
    const file = new File(['hello'], 'diagram.png', { type: 'image/png' })
    expect(validateSelectedImage(file, 'unknown')).toEqual(
      toAppError(
        'MODEL_NOT_SUPPORTED',
        'Image analysis is available only when the selected model explicitly reports vision support.',
      ),
    )
  })

  it('rejects unsupported mime types', () => {
    const file = new File(['hello'], 'note.txt', { type: 'text/plain' })
    expect(validateSelectedImage(file, 'supported')).toEqual(toAppError('UNSUPPORTED_FILE_TYPE'))
  })

  it('rejects files that are too large', () => {
    const oversized = new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], 'big.png', { type: 'image/png' })
    expect(validateSelectedImage(oversized, 'supported')).toEqual(toAppError('FILE_TOO_LARGE'))
  })

  it('rejects image analysis when the model explicitly lacks vision support', () => {
    const file = new File(['hello'], 'diagram.png', { type: 'image/png' })
    expect(validateSelectedImage(file, 'unsupported')).toEqual(
      toAppError(
        'MODEL_NOT_SUPPORTED',
        'Image analysis is available only when the selected model explicitly reports vision support.',
      ),
    )
  })
})
