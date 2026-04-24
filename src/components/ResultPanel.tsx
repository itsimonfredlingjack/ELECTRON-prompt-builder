import { useMemo, useState } from 'react'
import { useGenerationControls, useGenerationState } from '@/contexts/generationContext'
import { useOutputActions, useOutputMeta } from '@/contexts/outputContext'
import { useRuntimeState } from '@/contexts/runtimeContext'
import { writeClipboardText } from '@/lib/clipboard'

export function ResultPanel() {
  const { draftText, hasOutput } = useOutputMeta()
  const { clearOutput, setDraftText } = useOutputActions()
  const { startGeneration, canGenerate } = useGenerationControls()
  const { isBusy, isStreaming, generationState, error } = useGenerationState()
  const { selectedModelId, selectedModelReady, runtimeSnapshot } = useRuntimeState()
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')

  const hasDraft = draftText.trim().length > 0
  const wordCount = useMemo(() => (
    draftText.trim() ? draftText.trim().split(/\s+/).length : 0
  ), [draftText])
  const outputState = isStreaming
    ? 'Streaming'
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

  const handleCopy = async () => {
    if (!hasDraft) return
    const ok = await writeClipboardText(draftText, window.electronAPI, navigator.clipboard)
    setCopyState(ok ? 'copied' : 'error')
    window.setTimeout(() => setCopyState('idle'), 1500)
  }

  return (
    <section className="panel-stack output-workspace">
      <header className="panel-header output-header">
        <div>
          <p className="util-microtype">Output</p>
          <h2 className="panel-title">Generated prompt draft</h2>
        </div>

        <div className="output-actions">
          <ActionButton onClick={() => void handleCopy()} disabled={!hasDraft || isStreaming}>
            {copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Retry Copy' : 'Copy'}
          </ActionButton>
          <ActionButton onClick={clearOutput} disabled={!hasOutput && !isStreaming}>
            Clear
          </ActionButton>
          <ActionButton onClick={() => void startGeneration()} disabled={isBusy || !canGenerate} tone="primary">
            Regenerate
          </ActionButton>
        </div>
      </header>

      <div className="panel-body output-body">
        <div className="draft-status-grid">
          <StatusStat label="State" value={outputState} tone={isStreaming ? 'active' : hasDraft ? 'ready' : 'idle'} />
          <StatusStat label="Runtime" value={runtimeLabel} tone={selectedModelReady ? 'ready' : 'warning'} />
          <StatusStat label="Words" value={String(wordCount)} tone="idle" />
        </div>

        {!hasOutput && !isStreaming ? (
          <div className={`output-empty ${error ? 'is-error' : ''}`}>
            <p className="empty-title">{error ? 'Generation needs attention' : 'Draft bay is empty'}</p>
            <p className="empty-copy">
              {error ?? 'Build a prompt from the input panel to start the draft.'}
            </p>
          </div>
        ) : (
          <div className={`ui-output-shell ${isStreaming ? 'is-streaming' : ''}`}>
            <div className="output-editor-bar">
              <div>
                <span className="util-microtype">{isStreaming ? 'Streaming' : 'Editable draft'}</span>
                <p>{generationState}</p>
              </div>
              <span className="output-badge">{hasDraft ? 'Prompt text' : 'Waiting for first token'}</span>
            </div>

            <textarea
              value={draftText}
              onChange={(event) => setDraftText(event.target.value)}
              className="ui-output-editor"
              spellCheck={false}
            />
          </div>
        )}
      </div>
    </section>
  )
}

interface StatusStatProps {
  label: string
  value: string
  tone: 'active' | 'ready' | 'warning' | 'idle'
}

function StatusStat({ label, value, tone }: StatusStatProps) {
  return (
    <div className={`status-stat is-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
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
      className={`ui-action ${tone === 'primary' ? 'is-primary' : ''}`}
    >
      {children}
    </button>
  )
}
