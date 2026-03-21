import { useState, useRef, useEffect } from 'react'
import { writeClipboardText } from '@/lib/clipboard'

interface OutputAreaProps {
  value: string
  isStreaming: boolean
  onClear: () => void
}

export function OutputArea({ value, isStreaming, onClear }: OutputAreaProps) {
  const [copied, setCopied] = useState(false)
  const [cleared, setCleared] = useState(false)
  const preRef = useRef<HTMLPreElement>(null)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current)
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
        Prompt content stays in memory only. Nothing is exported unless you copy it.
      </p>
    </div>
  )
}
