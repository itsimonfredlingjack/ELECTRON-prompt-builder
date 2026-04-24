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
  const outputState = isStreaming
    ? 'Streaming'
    : showOfflineRecovery
      ? 'Local recovery'
      : hasDraft
        ? 'Ready'
        : error
        ? 'Needs attention'
        : 'Empty'
  const runtimeLabel = !runtimeSnapshot?.daemonReachable
    ? 'Ollama offline'
    : selectedModelReady
      ? selectedModelId ?? 'Model ready'
      : selectedModelId
        ? 'Model warming'
        : 'No model selected'
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

  const handleCopy = async () => {
    if (!hasDraft) return
    const ok = await writeClipboardText(draftText, window.electronAPI, navigator.clipboard)
    setCopyState(ok ? 'copied' : 'error')
    window.setTimeout(() => setCopyState('idle'), 1500)
  }

  return (
    <section className="draft" aria-label="Generated prompt draft">
      <header className="draft-head">
        <span className="draft-title">Prompt draft</span>
        {isStreaming ? (
          <span className="badge badge--elec"><span className="dot dot--electric" />streaming</span>
        ) : hasDraft ? (
          <span className="badge badge--mint"><span className="dot" />draft sharpened</span>
        ) : showOfflineRecovery ? (
          <span className="badge badge--quiet"><span className="dot dot--idle" />empty</span>
        ) : error ? (
          <span className="badge badge--warn"><span className="dot dot--warn" />needs attention</span>
        ) : (
          <span className="badge"><span className="dot dot--idle" />idle</span>
        )}

        {(hasDraft || isStreaming) && (
          <div className="draft-stats">
            <div className="draft-stat"><span className="n">{wordCount}</span><span className="l">words</span></div>
            <div className="draft-stat"><span className="n">{lineCount}</span><span className="l">lines</span></div>
            <div className="draft-stat"><span className="n">{hasDraft ? 'v1' : '-'}</span><span className="l">rev</span></div>
          </div>
        )}
      </header>

      {isStreaming && <div className="stream-track" />}

      <div className="draft-body slim-scroll">
        <div className={`ui-output-shell ${isStreaming ? 'is-streaming' : ''} ${showOfflineRecovery ? 'is-blocked' : ''}`}>
          <div className="output-editor-bar">
            <div>
              <span className="output-state-label">{outputState}</span>
              <p>{generationState} · {runtimeLabel}</p>
            </div>
            <span className="output-badge">
              {isStreaming ? 'Waiting for first token' : hasDraft ? 'Prompt text' : showOfflineRecovery ? 'Blocked locally' : 'Ready for first draft'}
            </span>
          </div>

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

          {showOfflineRecovery ? (
            <>
              <OfflineRecovery />
              <DraftHint error={null} />
            </>
          ) : hasOutput || isStreaming ? (
            <textarea
              value={draftText}
              onChange={(event) => setDraftText(event.target.value)}
              className="ui-output-editor"
              placeholder={isStreaming ? 'Waiting for the first local token...' : undefined}
              spellCheck={false}
            />
          ) : (
            <DraftHint error={error} />
          )}
        </div>
      </div>

      <footer className="draft-foot">
        <div className="draft-local">
          <span className={`dot ${selectedModelReady ? '' : 'dot--idle'}`} />
          <span>{isOffline ? 'local only' : 'local · nothing sent'}</span>
        </div>
        <div className="draft-actions">
          <ActionButton onClick={() => void startGeneration()} disabled={isBusy || !canGenerate}>
            Regenerate
          </ActionButton>
          <ActionButton onClick={clearOutput} disabled={!hasOutput && !isStreaming}>
            Clear
          </ActionButton>
          <ActionButton onClick={() => void handleCopy()} disabled={!hasDraft || isStreaming} tone="primary">
            {copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Retry Copy' : 'Copy'}
          </ActionButton>
        </div>
      </footer>
    </section>
  )
}

interface DraftHintProps {
  error: string | null
}

function DraftHint({ error }: DraftHintProps) {
  return (
    <div className={`editor-empty-hint ${error ? 'is-error' : ''}`}>
      <span className="editor-empty-kicker">{error ? 'Runtime message' : 'Next step'}</span>
      <p className="editor-empty-title">{error ? 'Generation needs attention.' : 'Draft is empty.'}</p>
      <p className="editor-empty-copy">
        {error ?? 'Write a brief on the left, then sharpen. Nothing leaves this machine.'}
      </p>
      {!error && (
        <p className="editor-empty-command"><span>⌘↵</span> sharpen</p>
      )}
    </div>
  )
}

function OfflineRecovery() {
  return (
    <div className="offline-recovery" role="status" aria-live="polite">
      <div className="recovery-card">
        <div className="recovery-copy">
          <span className="editor-empty-kicker">Local runtime</span>
          <h2>Start Ollama to draft locally.</h2>
          <p>
            Needs <code>127.0.0.1:11434</code>. Start the daemon, then use Retry beside Sharpen.
          </p>
        </div>
        <div className="offline-command" aria-label="Command to start Ollama">
          <span>$</span>
          <code>ollama serve</code>
        </div>
      </div>
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
