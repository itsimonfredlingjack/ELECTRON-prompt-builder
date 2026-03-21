import { describe, expect, it, vi } from 'vitest'
import { writeClipboardText } from '@/lib/clipboard'

describe('writeClipboardText', () => {
  it('uses electron bridge when available', async () => {
    const clipboardWrite = vi.fn().mockResolvedValue(true)

    await expect(writeClipboardText('hello', { clipboardWrite })).resolves.toBe(true)
    expect(clipboardWrite).toHaveBeenCalledWith('hello')
  })

  it('falls back to navigator clipboard when bridge is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)

    await expect(writeClipboardText('hello', undefined, { writeText })).resolves.toBe(true)
    expect(writeText).toHaveBeenCalledWith('hello')
  })

  it('returns false when clipboard write fails', async () => {
    const clipboardWrite = vi.fn().mockRejectedValue(new Error('nope'))

    await expect(writeClipboardText('hello', { clipboardWrite })).resolves.toBe(false)
  })
})
