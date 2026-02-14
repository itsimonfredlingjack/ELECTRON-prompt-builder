import { useState } from 'react'

interface OutputAreaProps {
  value: string
  isStreaming: boolean
}

export function OutputArea({ value, isStreaming }: OutputAreaProps) {
  const [copied, setCopied] = useState(false)

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

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-ghost-muted tracking-wide">Optimized prompt</label>
        {value && (
          <button
            onClick={handleCopy}
            disabled={isStreaming}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              copied
                ? 'bg-neon-green/10 text-neon-green border border-neon-green/40 shadow-glow-green'
                : 'btn-neon rounded-lg'
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
        className={`w-full min-h-[200px] px-4 py-3 glass-panel ${
          isStreaming ? 'animate-glow-pulse' : ''
        }`}
      >
        {value ? (
          <pre className={`whitespace-pre-wrap font-mono text-sm leading-relaxed ${
            isStreaming ? 'typing-cursor' : ''
          }`}>
            <span className="text-neon-cyan/90">{value}</span>
          </pre>
        ) : (
          <p className="text-ghost-dim italic text-sm">Your optimized prompt will appear here...</p>
        )}
      </div>
    </div>
  )
}
