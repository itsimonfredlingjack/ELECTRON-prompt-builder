import { type CSSProperties } from 'react'
import { useRuntimeActions, useRuntimeState } from '@/contexts/runtimeContext'

export function TitleBar() {
  const {
    selectedModelId,
    runtimeSnapshot,
    runtimeRefreshing,
    selectedModelReady,
    selectedModelInstalled,
  } = useRuntimeState()
  const { selectModel, refreshRuntime } = useRuntimeActions()

  const models = runtimeSnapshot?.modelListAvailable ? runtimeSnapshot.models : []
  const selectorValue = selectedModelId ?? models[0]?.id ?? ''
  const statusTone = runtimeRefreshing
    ? 'is-checking'
    : !runtimeSnapshot?.daemonReachable
      ? 'is-offline'
      : selectedModelReady
        ? 'is-ready'
        : selectedModelInstalled
          ? 'is-warming'
          : 'is-idle'
  const statusLabel = runtimeRefreshing
    ? 'Checking runtime'
    : !runtimeSnapshot?.daemonReachable
      ? 'Ollama offline'
      : selectedModelReady
        ? 'Model ready'
        : selectedModelInstalled
          ? 'Model warming'
          : 'Select model'
  const modelCountLabel = models.length === 1 ? '1 model' : `${models.length} models`
  const runtimeMeta = runtimeSnapshot?.modelListAvailable
    ? modelCountLabel
    : runtimeSnapshot?.daemonReachable
      ? 'Model list unavailable'
      : 'Local daemon unreachable'
  const showRuntimeMeta = runtimeSnapshot?.daemonReachable !== false || Boolean(selectorValue)
  const statusContext = runtimeRefreshing
    ? 'checking'
    : !runtimeSnapshot?.daemonReachable
      ? 'ollama offline'
      : selectedModelReady
      ? 'local ready'
      : selectedModelInstalled
        ? 'warming'
        : 'select model'
  const statusDotClass = runtimeRefreshing
    ? 'dot dot--warn'
    : !runtimeSnapshot?.daemonReachable
      ? 'dot dot--err'
      : selectedModelReady
        ? 'dot'
        : selectedModelInstalled
          ? 'dot dot--warn'
          : 'dot dot--idle'

  return (
    <header
      className="tb"
      style={{ WebkitAppRegion: 'drag' } as CSSProperties}
      onDoubleClick={() => window.electronAPI?.windowToggleMaximize()}
    >
      <div className="tb-native-spacer" aria-hidden="true" />

      <div className="tb-center">
        <Mark />
        <span className="tb-word">lazy prompter<span className="brand-dot" /></span>
        {showRuntimeMeta && (
          <>
            <span className="tb-sep" />
            <span className="tb-meta">{selectorValue || runtimeMeta}</span>
          </>
        )}
        <span className="tb-privacy">local only</span>
      </div>

      <div className="tb-right" style={{ WebkitAppRegion: 'no-drag' } as CSSProperties}>
        <div className={`badge ${statusTone === 'is-offline' ? 'badge--err' : statusTone === 'is-ready' ? 'badge--accent' : 'badge--warn'}`} aria-label={`Runtime status: ${statusLabel}`}>
          <span className={statusDotClass} />
          <span>{statusContext}</span>
        </div>

        <label className="sr-only" htmlFor="model-selector">Model selector</label>
        <select
          id="model-selector"
          aria-label="Current local model"
          value={selectorValue}
          onChange={(event) => selectModel(event.target.value || null)}
          disabled={runtimeRefreshing || models.length === 0}
          className="ui-select"
        >
          {models.length === 0 ? (
            <option value="">No local models</option>
          ) : (
            models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.id}
              </option>
            ))
          )}
        </select>

        <button
          type="button"
          onClick={() => void refreshRuntime()}
          className="btn btn--ghost btn--sm"
          aria-label="Refresh local runtime"
        >
          Refresh
        </button>
      </div>
    </header>
  )
}

function Mark() {
  return (
    <svg className="tb-mark" viewBox="0 0 200 200" fill="none" aria-hidden="true">
      <path d="M62 52 L42 72 L42 128 L62 148" stroke="currentColor" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
      <path className="mark-tip" d="M108 78 L142 100 L108 122" stroke="currentColor" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
