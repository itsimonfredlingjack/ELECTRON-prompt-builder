import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGenerationControls, useGenerationState } from '@/contexts/generationContext'
import { useOutputActions, useOutputMeta } from '@/contexts/outputContext'
import { useRuntimeState } from '@/contexts/runtimeContext'
import { writeClipboardText } from '@/lib/clipboard'
import {
  AlertTriangle,
  Check,
  Copy,
  RotateCcw,
  Sparkles,
  Trash2,
  WifiOff,
} from '@/lib/icons'
import { defaultSpring, offlineSpring, pressSpring } from '@/lib/springs'

type CopyState = 'idle' | 'copied' | 'error'
type StatusKey = 'streaming' | 'sharpened' | 'offline' | 'attention' | 'idle'

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
  const [copyState, setCopyState] = useState<CopyState>('idle')

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

  const statusKey: StatusKey = isStreaming
    ? 'streaming'
    : hasDraft
      ? 'sharpened'
      : showOfflineRecovery
        ? 'offline'
        : error
          ? 'attention'
          : 'idle'

  return (
    <section className="draft" aria-label="Generated prompt draft">
      <header className="draft-head">
        <span className="draft-title">Prompt draft</span>
        <StatusBadge statusKey={statusKey} />

        {(hasDraft || isStreaming) && (
          <div className="draft-stats">
            <div className="draft-stat"><span className="n">{wordCount}</span><span className="l">words</span></div>
            <div className="draft-stat"><span className="n">{lineCount}</span><span className="l">lines</span></div>
            <div className="draft-stat"><span className="n">{hasDraft ? 'v1' : '—'}</span><span className="l">rev</span></div>
          </div>
        )}
      </header>

      <AnimatePresence>
        {isStreaming && (
          <motion.div
            key="stream-track"
            className="stream-track"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          />
        )}
      </AnimatePresence>

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
          <ActionButton
            onClick={() => void startGeneration()}
            disabled={isBusy || !canGenerate}
            icon={<RotateCcw size={12} strokeWidth={2.25} />}
          >
            Regenerate
          </ActionButton>
          <ActionButton
            onClick={clearOutput}
            disabled={!hasOutput && !isStreaming}
            icon={<Trash2 size={12} strokeWidth={2.25} />}
          >
            Clear
          </ActionButton>
          <CopyButton
            onClick={() => void handleCopy()}
            disabled={!hasDraft || isStreaming}
            copyState={copyState}
          />
        </div>
      </footer>
    </section>
  )
}

function StatusBadge({ statusKey }: { statusKey: StatusKey }) {
  const config = STATUS_CONFIG[statusKey]
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={statusKey}
        layout
        initial={{ opacity: 0, y: -2 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 2 }}
        transition={defaultSpring}
        className={`badge ${config.className}`}
      >
        <span className={`dot ${config.dot}`} />
        {config.label}
      </motion.span>
    </AnimatePresence>
  )
}

const STATUS_CONFIG: Record<StatusKey, { label: string; className: string; dot: string }> = {
  streaming: { label: 'streaming', className: 'badge--accent', dot: '' },
  sharpened: { label: 'sharpened', className: 'badge--accent', dot: '' },
  offline: { label: 'offline', className: 'badge--err', dot: 'dot--err' },
  attention: { label: 'needs attention', className: 'badge--warn', dot: 'dot--warn' },
  idle: { label: 'idle', className: '', dot: 'dot--idle' },
}

interface DraftHintProps {
  error: string | null
}

function DraftHint({ error }: DraftHintProps) {
  if (error) {
    return (
      <motion.div
        className="empty is-error"
        role="alert"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={defaultSpring}
      >
        <span className="empty-glyph"><AlertTriangle size={26} strokeWidth={1.7} /></span>
        <div className="empty-title">Generation needs attention.</div>
        <div className="empty-sub">{error}</div>
      </motion.div>
    )
  }
  return (
    <motion.div
      className="empty"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={defaultSpring}
    >
      <span className="empty-glyph"><Sparkles size={26} strokeWidth={1.7} /></span>
      <div className="empty-title">Sharpen a brief to begin.</div>
      <div className="empty-sub">Write a brief on the left, then sharpen. Nothing leaves this machine.</div>
      <div className="empty-row">
        <span className="kbd kbd--accent">⌘</span>
        <span className="kbd kbd--accent">↵</span>
        <span>sharpen</span>
      </div>
    </motion.div>
  )
}

function OfflineRecovery() {
  return (
    <motion.div
      className="fullstate"
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={offlineSpring}
    >
      <span className="fullstate-icon"><WifiOff size={26} strokeWidth={1.7} /></span>
      <div className="fullstate-title">Ollama is sleeping.</div>
      <div className="fullstate-sub">
        Start Ollama to draft locally. Needs <code>127.0.0.1:11434</code>. Start the daemon, then use Retry beside Sharpen.
      </div>
      <div className="fullstate-code"><span>$</span> ollama serve</div>
      <div className="fullstate-note">no cloud fallback · by design</div>
    </motion.div>
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
  icon?: React.ReactNode
}

function ActionButton({ children, disabled = false, onClick, icon }: ActionButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={pressSpring}
      className="btn btn--sm btn--ghost"
    >
      {icon}
      {children}
    </motion.button>
  )
}

function CopyButton({
  onClick,
  disabled,
  copyState,
}: {
  onClick: () => void
  disabled: boolean
  copyState: CopyState
}) {
  const config = COPY_CONFIG[copyState]
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      animate={copyState === 'copied' ? { scale: [1, 1.06, 1] } : { scale: 1 }}
      transition={copyState === 'copied' ? { duration: 0.32, ease: [0.34, 1.32, 0.64, 1] } : pressSpring}
      className="btn btn--sm"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={copyState}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          transition={defaultSpring}
          className="inline-flex items-center gap-1.5"
        >
          {config.icon}
          {config.label}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}

const COPY_CONFIG: Record<CopyState, { label: string; icon: React.ReactNode }> = {
  idle: { label: 'Copy', icon: <Copy size={12} strokeWidth={2.25} /> },
  copied: { label: 'Copied', icon: <Check size={12} strokeWidth={2.5} /> },
  error: { label: 'Retry copy', icon: <RotateCcw size={12} strokeWidth={2.25} /> },
}
