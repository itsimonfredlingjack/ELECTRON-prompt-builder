import { useMemo, useState } from 'react'
import { useGenerationControls, useGenerationState } from '@/contexts/generationContext'
import { useOutputActions, useOutputMeta } from '@/contexts/outputContext'
import { useRuntimeState } from '@/contexts/runtimeContext'
import { writeClipboardText } from '@/lib/clipboard'

export function ResultPanel() {
  const {
    activeVersion,
    currentRequestMode,
    draftText,
    hasOutput,
    promptIntent,
    promptStrategy,
    promptTarget,
    sourceValue,
  } = useOutputMeta()
  const { clearOutput, setDraftText } = useOutputActions()
  const { startGeneration, canGenerate } = useGenerationControls()
  const { isBusy, isStreaming, generationState, error } = useGenerationState()
  const { selectedModelId, selectedModelReady, runtimeSnapshot } = useRuntimeState()
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')

  const hasDraft = draftText.trim().length > 0
  const isOffline = runtimeSnapshot ? !runtimeSnapshot.daemonReachable : true
  const showOfflineRecovery = isOffline && !hasDraft && !isStreaming
  const wordCount = useMemo(() => (
    draftText.trim() ? draftText.trim().split(/\s+/).length : 0
  ), [draftText])
  const lineCount = useMemo(() => (
    draftText.trim() ? draftText.split(/\n/).length : 0
  ), [draftText])

  const provenanceMeta = useMemo(() => {
    if (!activeVersion) return null

    return [
      activeVersion.title || formatRequestMode(currentRequestMode),
      formatIsoDate(activeVersion.createdAt),
      promptIntent,
      promptTarget,
      promptStrategy,
    ].filter(Boolean).join(' · ')
  }, [activeVersion, currentRequestMode, promptIntent, promptStrategy, promptTarget])
  const provenanceSource = activeVersion?.sourceValue || sourceValue
  const showDraftProvenance = hasDraft && !!activeVersion
  const showEditor = hasOutput || isStreaming

  const handleCopy = async () => {
    if (!hasDraft) return
    const ok = await writeClipboardText(draftText, window.electronAPI, navigator.clipboard)
    setCopyState(ok ? 'copied' : 'error')
    window.setTimeout(() => setCopyState('idle'), 1500)
  }

  const runtimeMeta = selectedModelReady ? selectedModelId : selectedModelId ? 'model warming' : 'no model'

  return (
    <section className="draft" aria-label="Generated prompt draft">
      <header className="draft-head">
        <span className="draft-title">Prompt draft</span>
        {isStreaming ? (
          <span className="badge badge--mint"><span className="dot" />streaming</span>
        ) : hasDraft ? (
          <span className="badge badge--mint"><span className="dot" />sharpened</span>
        ) : showOfflineRecovery ? (
          <span className="badge badge--err"><span className="dot dot--err" />offline</span>
        ) : error ? (
          <span className="badge badge--warn"><span className="dot dot--warn" />needs attention</span>
        ) : (
          <span className="badge"><span className="dot dot--idle" />idle</span>
        )}

        {(hasDraft || isStreaming) && (
          <div className="draft-stats">
            <div className="draft-stat"><span className="n">{wordCount}</span><span className="l">words</span></div>
            <div className="draft-stat"><span className="n">{lineCount}</span><span className="l">lines</span></div>
            <div className="draft-stat"><span className="n">{hasDraft ? 'v1' : '—'}</span><span className="l">rev</span></div>
          </div>
        )}
      </header>

      {isStreaming && <div className="stream-track" />}

      {showOfflineRecovery ? (
        <OfflineRecovery />
      ) : showEditor ? (
        <div className="draft-body slim-scroll">
          {showDraftProvenance && (
            <div className="draft-provenance" aria-label="Draft provenance">
              <span className="draft-provenance-kicker">Loaded draft</span>
              <span className="draft-provenance-source">
                {provenanceSource || 'No source brief saved.'}
              </span>
              {provenanceMeta && (
                <span className="draft-provenance-meta">{provenanceMeta}</span>
              )}
            </div>
          )}
          <textarea
            value={draftText}
            onChange={(event) => setDraftText(event.target.value)}
            className="ui-output-editor"
            placeholder={isStreaming ? 'Waiting for first token…' : undefined}
            spellCheck={false}
            aria-label="Prompt draft"
          />
        </div>
      ) : (
        <DraftHint error={error} />
      )}

      <footer className="draft-foot">
        <div className="draft-local">
          <span className={`dot ${selectedModelReady ? '' : 'dot--idle'}`} />
          <span>{isOffline ? 'local · offline' : `local · ${runtimeMeta}`}</span>
          <span className="draft-local-sep">·</span>
          <span>{generationState}</span>
        </div>
        <div className="draft-actions">
          <ActionButton onClick={() => void startGeneration()} disabled={isBusy || !canGenerate}>
            Regenerate
          </ActionButton>
          <ActionButton onClick={clearOutput} disabled={!hasOutput && !isStreaming}>
            Clear
          </ActionButton>
          <ActionButton onClick={() => void handleCopy()} disabled={!hasDraft || isStreaming} tone="primary">
            {copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Retry copy' : 'Copy'}
          </ActionButton>
        </div>
      </footer>
    </section>
  )
}

function EmptyMark() {
  return (
    <svg className="empty-glyph" viewBox="0 0 200 200" fill="none" aria-hidden="true">
      <path d="M60 50 L40 70 L40 130 L60 150" stroke="#485367" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M110 75 L145 100 L110 125" stroke="#6b7789" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

interface DraftHintProps {
  error: string | null
}

function DraftHint({ error }: DraftHintProps) {
  if (error) {
    return (
      <div className="empty is-error" role="alert">
        <EmptyMark />
        <div className="empty-title">Generation needs attention.</div>
        <div className="empty-sub">{error}</div>
      </div>
    )
  }
  return (
    <div className="empty">
      <EmptyMark />
      <div className="empty-title">Draft is empty.</div>
      <div className="empty-sub">Write a brief on the left, then sharpen. Nothing leaves this machine.</div>
      <div className="empty-row">
        <span className="kbd kbd--mint">⌘</span>
        <span className="kbd kbd--mint">↵</span>
        <span>sharpen</span>
      </div>
    </div>
  )
}

function OfflineRecovery() {
  return (
    <div className="fullstate" role="status" aria-live="polite">
      <svg className="fullstate-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 17l6-6-6-6M12 19h8"/>
      </svg>
      <div className="fullstate-title">Ollama is not running.</div>
      <div className="fullstate-sub">
        Start Ollama to draft locally. Needs <code>127.0.0.1:11434</code>. Start the daemon, then use Retry beside Sharpen.
      </div>
      <div className="fullstate-code"><span>$</span> ollama serve</div>
      <div className="fullstate-note">no cloud fallback · by design</div>
    </div>
  )
}

function formatRequestMode(mode: string) {
  return mode.replace(/-/g, ' ')
}

function formatIsoDate(value: string) {
  if (!value) return null
  return value.slice(0, 10)
}

interface ActionButtonProps {
  children: string
  disabled?: boolean
  onClick: () => void
  tone?: 'primary' | 'neutral'
}

function ActionButton({ children, disabled = false, onClick, tone = 'neutral' }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`btn btn--sm ${tone === 'primary' ? '' : 'btn--ghost'}`}
    >
      {children}
    </button>
  )
}
