import { useState, useRef, useEffect } from 'react'
import { writeClipboardText } from '@/lib/clipboard'
import { buildShareText, readShareMetrics, trackShareMetric } from '@/lib/share'
import type { Category } from '@/types'

interface OutputAreaProps {
  value: string
  sourceValue: string
  category: Category
  isStreaming: boolean
  onClear: () => void
}

export function OutputArea({ value, sourceValue, category, isStreaming, onClear }: OutputAreaProps) {
  const [copied, setCopied] = useState(false)
  const [cleared, setCleared] = useState(false)
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'error'>('idle')
  const [shareCopies, setShareCopies] = useState(() => readShareMetrics(window.localStorage).share_copied)
  const preRef = useRef<HTMLPreElement>(null)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const shareTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleCopy = async () => {
    if (!value) return
    const ok = await writeClipboardText(value, window.electronAPI, navigator.clipboard)
    if (!ok) return
    setCopied(true)
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current)
    }
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000)
  }

  const handleClear = () => {
    if (!value) return
    onClear()
    setCleared(true)
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current)
    }
    clearTimeoutRef.current = setTimeout(() => setCleared(false), 1200)
  }

  const handleShare = async () => {
    if (!value || !sourceValue.trim()) return

    trackShareMetric('share_clicked', window.localStorage)

    const ok = await writeClipboardText(
      buildShareText({
        category,
        roughPrompt: sourceValue,
        rewrittenPrompt: value,
      }),
      window.electronAPI,
      navigator.clipboard,
    )

    if (!ok) {
      setShareState('error')
      if (shareTimeoutRef.current) {
        clearTimeout(shareTimeoutRef.current)
      }
      shareTimeoutRef.current = setTimeout(() => setShareState('idle'), 2200)
      return
    }

    const metrics = trackShareMetric('share_copied', window.localStorage)
    setShareCopies(metrics.share_copied)
    setShareState('copied')
    if (shareTimeoutRef.current) {
      clearTimeout(shareTimeoutRef.current)
    }
    shareTimeoutRef.current = setTimeout(() => setShareState('idle'), 2400)
  }

  useEffect(() => {
    if (isStreaming && preRef.current) {
      preRef.current.scrollTop = preRef.current.scrollHeight
    }
  }, [value, isStreaming])

  useEffect(() => {
    if (value) {
      setCleared(false)
    }
  }, [value])

  useEffect(() => {
    setShareState('idle')
  }, [value, sourceValue, category])

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current)
      }
      if (shareTimeoutRef.current) {
        clearTimeout(shareTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="flex flex-col gap-2">
      <div className="sticky top-0 z-10 -mx-1 px-1 flex items-center justify-between bg-void/80 backdrop-blur-sm py-1 rounded-lg">
        <label className="section-label">
          Clearer prompt
        </label>
        {value && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              disabled={isStreaming}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border bg-void-light text-ghost-muted border-void-border hover:text-ghost hover:bg-void transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Clear output"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18h12M9 6h6m-7 0h8l-1 12a2 2 0 01-2 2h-4a2 2 0 01-2-2L8 6z" />
              </svg>
              Clear
            </button>
            <button
              onClick={() => void handleShare()}
              disabled={isStreaming || !sourceValue.trim()}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                shareState === 'copied'
                  ? 'bg-void-light text-signal-success border-signal-success'
                  : shareState === 'error'
                    ? 'bg-void-light text-signal-error border-signal-error'
                    : 'bg-void text-ghost border-void-border hover:bg-void-light hover:border-ghost-muted'
              }`}
              title="Copy a share-ready before/after post"
            >
              {shareState === 'copied' ? (
                <>
                  <svg className="w-4 h-4 animate-bounce-short" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Shared!
                </>
              ) : shareState === 'error' ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Retry share
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C9.886 12.14 11.832 12.14 13.034 13.342l.355.355a2.75 2.75 0 103.889-3.889l-1.768-1.768a2.75 2.75 0 00-3.889 0l-.702.703M15.316 10.658C14.114 11.86 12.168 11.86 10.966 10.658l-.355-.355a2.75 2.75 0 10-3.889 3.889l1.768 1.768a2.75 2.75 0 003.889 0l.702-.703" />
                  </svg>
                  Share
                </>
              )}
            </button>
            <button
              onClick={handleCopy}
              disabled={isStreaming}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                copied
                  ? 'bg-void-light text-signal-success border-signal-success'
                  : 'bg-void text-ghost border-void-border hover:bg-void-light hover:border-ghost-muted'
              }`}
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4 animate-bounce-short" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
        )}
      </div>
      {shareState === 'copied' && (
        <p className="text-[11px] text-signal-success animate-fade-in">
          Share-ready before/after copied. Device share copies: {shareCopies}.
        </p>
      )}
      {shareState === 'error' && (
        <p className="text-[11px] text-signal-error animate-fade-in">
          Share copy failed. Try again in a moment.
        </p>
      )}
      <div
        className={`w-full h-60 md:h-80 lg:h-[35rem] rounded-lg overflow-hidden flex flex-col transition-colors border shadow-inner ${isStreaming
            ? 'bg-void-light border-accent'
            : 'bg-void-light border-void-border'
          }`}
      >
        <div className="flex-1 overflow-y-auto output-fade-edges px-4 py-3 min-h-0">
          {value ? (
            <pre
              ref={preRef}
              className={`font-mono text-[13px] leading-[1.6] tracking-tight text-ghost-bright whitespace-pre-wrap break-words selection:bg-accent/10 ${isStreaming ? 'typing-cursor' : ''
                }`}
              style={{ fontVariantLigatures: 'none' }}
            >
              {value}
            </pre>
          ) : (
            <>
              {cleared ? (
                <p className="text-signal-success text-xs font-medium font-sans animate-fade-in">
                  Output cleared.
                </p>
              ) : (
                <p className="text-ghost-dim italic text-xs font-normal font-sans">
                  Your clearer, ready-to-copy prompt will appear here...
                </p>
              )}
            </>
          )}
        </div>
      </div>
      <p className="text-[10px] text-ghost-muted">
        Prompt content stays in memory only. Nothing leaves the app unless you copy or share it.
      </p>
    </div>
  )
}
