import { useState, useRef, useEffect } from 'react'

interface OutputAreaProps {
  value: string
  isStreaming: boolean
}

export function OutputArea({ value, isStreaming }: OutputAreaProps) {
  const [copied, setCopied] = useState(false)
  const preRef = useRef<HTMLPreElement>(null)

  const handleCopy = async () => {
    if (!value) return
    try {
      if (window.electronAPI?.clipboardWrite) {
        window.electronAPI.clipboardWrite(value)
      } else {
        await navigator.clipboard.writeText(value)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      console.error('Failed to copy')
    }
  }

  useEffect(() => {
    if (isStreaming && preRef.current) {
      preRef.current.scrollTop = preRef.current.scrollHeight
    }
  }, [value, isStreaming])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="section-label">
          Optimized prompt
        </label>
        {value && (
          <button
            onClick={handleCopy}
            disabled={isStreaming}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors duration-200 ${
              copied
                ? 'text-ghost-bright surface'
                : 'btn-primary'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        )}
      </div>
      <div
        className={`output-panel w-full h-40 overflow-hidden flex flex-col transition-colors ${
          isStreaming ? 'border-accent' : ''
        }`}
      >
        <div className="flex-1 overflow-y-auto output-fade-edges px-4 py-3 min-h-0">
          {value ? (
            <pre
              ref={preRef}
              className={`font-mono text-[12px] leading-[1.6] tracking-tight text-ghost-bright whitespace-pre-wrap break-words ${
                isStreaming ? 'typing-cursor' : ''
              }`}
              style={{ fontVariantLigatures: 'none' }}
            >
              {value}
            </pre>
          ) : (
            <p className="text-ghost-dim italic text-xs font-normal font-sans">
              Your optimized prompt will appear here...
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
