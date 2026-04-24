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
  const statusContext = runtimeRefreshing
    ? 'REFRESHING'
    : !runtimeSnapshot?.daemonReachable
      ? 'OFFLINE'
      : selectedModelReady
      ? 'READY'
      : selectedModelInstalled
        ? 'WARMING'
        : 'SELECT'

  return (
    <header
      className="app-header"
      style={{ WebkitAppRegion: 'drag' } as CSSProperties}
      onDoubleClick={() => window.electronAPI?.windowToggleMaximize()}
    >
      <div className="brand-lockup min-w-0">
        <span className="brand-glyph" aria-hidden="true" />
        <div className="min-w-0">
          <p className="brand-title">Prompt Builder</p>
          <p className="brand-subtitle">LOCAL · OLLAMA · {runtimeMeta}</p>
        </div>
      </div>

      <div className="header-context" aria-hidden="true">
        <span>Builder</span>
        <span>Prompt</span>
        <span>Draft</span>
      </div>

      <div className="command-center" style={{ WebkitAppRegion: 'no-drag' } as CSSProperties}>
        <div className={`runtime-pill ${statusTone}`} aria-label={`Runtime status: ${statusLabel}`}>
          <span className="runtime-dot" />
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
          className="ui-action"
        >
          Refresh
        </button>
      </div>
    </header>
  )
}
