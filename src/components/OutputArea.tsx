import { useState, useRef, useEffect } from 'react'

const APP_SHARE_URL = 'https://github.com/local/ai-prompt-builder'

function compressText(text: string, maxLength: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength - 1)}…`
}

function buildShareText(prompt: string): string {
  const snippet = compressText(prompt, 170)
  return [
    'I just turned a rough idea into a production-ready AI prompt with AI Prompt Builder.',
    '',
    `"${snippet}"`,
    '',
    `Try it: ${APP_SHARE_URL}`,
  ].join('\n')
}

interface OutputAreaProps {
  value: string
  isStreaming: boolean
}

export function OutputArea({ value, isStreaming }: OutputAreaProps) {
  const [copied, setCopied] = useState(false)
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared' | 'copied'>('idle')
  const preRef = useRef<HTMLPreElement>(null)

  const writeClipboard = async (text: string): Promise<boolean> => {
    try {
      if (window.electronAPI?.clipboardWrite) {
        window.electronAPI.clipboardWrite(text)
      } else {
        await navigator.clipboard.writeText(text)
      }
      return true
    } catch {
      return false
    }
  }

  const handleCopy = async () => {
    if (!value) return
    const ok = await writeClipboard(value)
    if (!ok) return
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (!value || isStreaming) return

    const shareText = buildShareText(value)
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`

    await window.electronAPI?.trackEvent('share_clicked', { channel: 'x' })
    const copiedToClipboard = await writeClipboard(shareText)
    let openedExternal = false

    try {
      if (window.electronAPI?.openExternal) {
        await window.electronAPI.openExternal(shareUrl)
        openedExternal = true
      } else {
        window.open(shareUrl, '_blank', 'noopener,noreferrer')
        openedExternal = true
      }
    } catch {
      openedExternal = false
    }

    await window.electronAPI?.trackEvent('share_completed', {
      channel: 'x',
      result: openedExternal ? 'opened' : copiedToClipboard ? 'copied' : 'failed',
    })

    if (openedExternal) {
      setShareStatus('shared')
    } else if (copiedToClipboard) {
      setShareStatus('copied')
    } else {
      setShareStatus('idle')
    }
    setTimeout(() => setShareStatus('idle'), 2500)
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
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              disabled={isStreaming}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                shareStatus !== 'idle'
                  ? 'bg-void-light text-accent border-accent'
                  : 'bg-void text-ghost border-void-border hover:bg-void-light hover:border-ghost-muted'
              }`}
            >
              {shareStatus === 'shared' ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H9m8 0v8" />
                  </svg>
                  Shared on X
                </>
              ) : shareStatus === 'copied' ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Share copied
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H9m8 0v8" />
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
      <div
        className={`w-full h-56 md:h-72 rounded-lg overflow-hidden flex flex-col transition-colors border shadow-inner ${isStreaming
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
            <p className="text-ghost-dim italic text-xs font-normal font-sans">
              Your optimized prompt will appear here...
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
