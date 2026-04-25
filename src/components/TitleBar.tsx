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

  const baseBadge = "inline-flex items-center flex-none whitespace-nowrap gap-1.5 min-h-[22px] px-2 py-0.5 font-sans text-[11.5px] font-medium tracking-tight rounded-pill border"
  const badgeClasses = statusTone === 'is-offline'
    ? `${baseBadge} text-err bg-err/10 border-err/25`
    : statusTone === 'is-ready'
      ? `${baseBadge} text-accent-500 bg-accent-500/10 border-accent-500/20`
      : `${baseBadge} text-warn bg-warn/10 border-warn/25`

  const baseDot = "w-[7px] h-[7px] flex-none rounded-full"
  const dotClasses = runtimeRefreshing
    ? `${baseDot} bg-warn shadow-[0_0_0_1px_rgba(216,184,90,0.20),0_0_8px_0px_var(--highlighter)] animate-[sleepy-breathe_4s_ease-in-out_infinite]`
    : !runtimeSnapshot?.daemonReachable
      ? `${baseDot} bg-err shadow-[0_0_0_1px_rgba(10,132,255,0.18),0_0_6px_0px_var(--accent-glow)] animate-[sleepy-breathe_2.4s_ease-in-out_infinite]`
      : selectedModelReady
        ? `${baseDot} bg-accent-500 shadow-[0_0_0_1px_rgba(10,132,255,0.18),0_0_6px_0px_var(--accent-glow)] animate-[sleepy-breathe_4s_ease-in-out_infinite]`
        : selectedModelInstalled
          ? `${baseDot} bg-warn shadow-[0_0_0_1px_rgba(216,184,90,0.20),0_0_8px_0px_var(--highlighter)] animate-[sleepy-breathe_4s_ease-in-out_infinite]`
          : `${baseDot} bg-ink-500 shadow-[0_0_0_1px_var(--chrome-line-2),0_0_4px_0px_var(--chrome-line)] animate-[sleepy-breathe_6s_ease-in-out_infinite]`

  return (
    <header
      className="min-w-0 grid grid-cols-[80px_minmax(260px,1fr)_minmax(360px,auto)] max-[980px]:grid-cols-[80px_minmax(180px,1fr)_auto] max-[820px]:grid-cols-1 items-center gap-5 max-[820px]:gap-2 px-3.5 max-[820px]:px-3 py-0 max-[820px]:py-2.5 border-b border-chrome-line bg-surface-900"
      style={{ WebkitAppRegion: 'drag' } as CSSProperties}
      onDoubleClick={() => window.electronAPI?.windowToggleMaximize()}
    >
      <div className="w-[80px] h-[1px] max-[820px]:hidden" aria-hidden="true" />

      <div className="min-w-0 flex items-center justify-center max-[820px]:justify-start max-[820px]:flex-wrap gap-2.5">
        <Mark />
        <span className="text-ink-100 font-display text-base font-medium tracking-tight">lazy prompter<span className="text-accent-500">.</span></span>
        {showRuntimeMeta && (
          <>
            <span className="w-px h-3.5 flex-none bg-chrome-line-2" />
            <span className="min-w-0 overflow-hidden text-ink-400 font-mono text-xs whitespace-nowrap text-ellipsis max-[980px]:hidden">{selectorValue || runtimeMeta}</span>
          </>
        )}
        <span className="flex-none text-electric-400 opacity-80 min-w-0 overflow-hidden font-mono text-xs whitespace-nowrap text-ellipsis max-[980px]:hidden">local only</span>
      </div>

      <div className="min-w-0 flex items-center justify-end max-[820px]:justify-start max-[820px]:flex-wrap gap-2.5" style={{ WebkitAppRegion: 'no-drag' } as CSSProperties}>
        <div className={badgeClasses} aria-label={`Runtime status: ${statusLabel}`}>
          <span className={dotClasses} />
          <span>{statusContext}</span>
        </div>

        <label className="sr-only" htmlFor="model-selector">Model selector</label>
        <select
          id="model-selector"
          aria-label="Current local model"
          value={selectorValue}
          onChange={(event) => selectModel(event.target.value || null)}
          disabled={runtimeRefreshing || models.length === 0}
          className="w-auto min-w-[190px] max-[980px]:min-w-[170px] max-w-[280px] max-[980px]:max-w-[210px] max-[760px]:min-w-0 max-[760px]:flex-1 h-[30px] px-3 font-mono text-xs text-ink-200 bg-surface-700 border border-chrome-line rounded-md focus-visible:outline-2 focus-visible:outline-accent-500 focus-visible:outline-offset-2 disabled:opacity-45"
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
          className="inline-flex items-center justify-center flex-none min-h-[32px] px-4 rounded-md font-sans text-sm font-medium transition-colors duration-140 select-none text-ink-200 bg-transparent border border-chrome-line shadow-sm hover:text-ink-100 hover:bg-surface-800 disabled:opacity-45 h-6 px-2 text-xs"
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
    <svg className="w-[18px] h-[18px] flex-none text-ink-200" viewBox="0 0 200 200" fill="none" aria-hidden="true">
      <path d="M62 52 L42 72 L42 128 L62 148" stroke="currentColor" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
      <path className="text-accent-400" d="M108 78 L142 100 L108 122" stroke="currentColor" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
