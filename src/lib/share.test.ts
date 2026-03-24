import { describe, expect, it } from 'vitest'
import { buildShareText, readShareMetrics, trackShareMetric } from '@/lib/share'

function createStorage(): Storage {
  const data = new Map<string, string>()

  return {
    get length() {
      return data.size
    },
    clear() {
      data.clear()
    },
    getItem(key) {
      return data.get(key) ?? null
    },
    key(index) {
      return Array.from(data.keys())[index] ?? null
    },
    removeItem(key) {
      data.delete(key)
    },
    setItem(key, value) {
      data.set(key, value)
    },
  }
}

describe('share helpers', () => {
  it('builds a concise before and after share post', () => {
    const shareText = buildShareText({
      category: 'analysis',
      roughPrompt: 'summarize this transcript and tell me what matters',
      rewrittenPrompt: 'Summarize the transcript in five bullets, then list the three highest-signal follow-up actions.',
    })

    expect(shareText).toContain('rough analysis prompt')
    expect(shareText).toContain('Before:')
    expect(shareText).toContain('After:')
    expect(shareText).toContain('Built locally with Ollama')
  })

  it('tracks share metrics without storing prompt content', () => {
    const storage = createStorage()

    const clicked = trackShareMetric('share_clicked', storage, new Date('2026-03-24T10:00:00.000Z'))
    const copied = trackShareMetric('share_copied', storage, new Date('2026-03-24T10:01:00.000Z'))
    const snapshot = readShareMetrics(storage)

    expect(clicked.share_clicked).toBe(1)
    expect(copied.share_copied).toBe(1)
    expect(snapshot.lastSharedAt).toBe('2026-03-24T10:01:00.000Z')
    expect(storage.getItem('ai-prompt-builder.share-metrics')).not.toContain('roughPrompt')
  })
})
