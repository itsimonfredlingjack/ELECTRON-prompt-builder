import type { Category } from '@/types'

export type ShareMetricName = 'share_clicked' | 'share_copied'

export interface ShareMetricsSnapshot {
  share_clicked: number
  share_copied: number
  lastSharedAt: string | null
}

interface BuildShareTextOptions {
  category: Category
  roughPrompt: string
  rewrittenPrompt: string
}

const SHARE_METRICS_KEY = 'ai-prompt-builder.share-metrics'
const DEFAULT_SHARE_METRICS: ShareMetricsSnapshot = {
  share_clicked: 0,
  share_copied: 0,
  lastSharedAt: null,
}

function trimForShare(value: string, limit: number): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (!normalized) return ''
  if (normalized.length <= limit) return normalized
  return `${normalized.slice(0, Math.max(0, limit - 1)).trimEnd()}...`
}

function getCategoryLabel(category: Category): string {
  if (category === 'analysis') return 'analysis'
  if (category === 'creative') return 'creative'
  return 'coding'
}

export function buildShareText({
  category,
  roughPrompt,
  rewrittenPrompt,
}: BuildShareTextOptions): string {
  const trimmedInput = trimForShare(roughPrompt, 180)
  const trimmedOutput = trimForShare(rewrittenPrompt, 280)
  const categoryLabel = getCategoryLabel(category)

  return [
    `Turned a rough ${categoryLabel} prompt into a ready-to-use one with AI Prompt Builder.`,
    '',
    `Before: "${trimmedInput}"`,
    '',
    `After: "${trimmedOutput}"`,
    '',
    'Built locally with Ollama. Try it with your messiest prompt.',
  ].join('\n')
}

export function readShareMetrics(storage?: Storage): ShareMetricsSnapshot {
  if (!storage) return DEFAULT_SHARE_METRICS

  try {
    const rawValue = storage.getItem(SHARE_METRICS_KEY)
    if (!rawValue) return DEFAULT_SHARE_METRICS

    const parsed = JSON.parse(rawValue) as Partial<ShareMetricsSnapshot>
    return {
      share_clicked: Number.isFinite(parsed.share_clicked) ? Number(parsed.share_clicked) : 0,
      share_copied: Number.isFinite(parsed.share_copied) ? Number(parsed.share_copied) : 0,
      lastSharedAt: typeof parsed.lastSharedAt === 'string' ? parsed.lastSharedAt : null,
    }
  } catch {
    return DEFAULT_SHARE_METRICS
  }
}

export function trackShareMetric(
  metric: ShareMetricName,
  storage?: Storage,
  now = new Date(),
): ShareMetricsSnapshot {
  if (!storage) return DEFAULT_SHARE_METRICS

  const currentSnapshot = readShareMetrics(storage)
  const nextSnapshot = {
    ...currentSnapshot,
    [metric]: currentSnapshot[metric] + 1,
    lastSharedAt: metric === 'share_copied' ? now.toISOString() : currentSnapshot.lastSharedAt,
  }

  try {
    storage.setItem(SHARE_METRICS_KEY, JSON.stringify(nextSnapshot))
  } catch {
    return nextSnapshot
  }

  return nextSnapshot
}
