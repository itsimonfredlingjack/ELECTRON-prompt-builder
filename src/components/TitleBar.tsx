import { type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRuntimeActions, useRuntimeState } from '@/contexts/runtimeContext'
import { RefreshCw } from '@/lib/icons'
import { defaultSpring, pressSpring } from '@/lib/springs'

type StatusTone = 'is-checking' | 'is-offline' | 'is-ready' | 'is-warming' | 'is-idle'

const statusToneStyles: Record<StatusTone, { dot: string; text: string; ring: string; pulse: string }> = {
  'is-checking': {
    dot: 'bg-warn shadow-[0_0_0_1px_rgba(240,148,90,0.30),0_0_6px_0_rgba(240,148,90,0.40)]',
    text: 'text-warn',
    ring: 'border-warn/30 bg-warn/[0.06]',
    pulse: 'animate-[sleepy-breathe_3s_ease-in-out_infinite]',
  },
  'is-offline': {
    dot: 'bg-err shadow-[0_0_0_1px_rgba(232,90,106,0.32),0_0_6px_0_rgba(232,90,106,0.40)]',
    text: 'text-err',
    ring: 'border-err/30 bg-err/[0.06]',
    pulse: 'animate-[sleepy-breathe_2.4s_ease-in-out_infinite]',
  },
  'is-ready': {
    dot: 'bg-accent-500 shadow-[0_0_0_1px_rgba(212,165,116,0.35),0_0_8px_0_rgba(212,165,116,0.45)]',
    text: 'text-accent-300',
    ring: 'border-accent-500/25 bg-accent-500/[0.06]',
    pulse: 'animate-[sleepy-breathe_5s_ease-in-out_infinite]',
  },
  'is-warming': {
    dot: 'bg-warn shadow-[0_0_0_1px_rgba(240,148,90,0.30),0_0_6px_0_rgba(240,148,90,0.35)]',
    text: 'text-warn',
    ring: 'border-warn/25 bg-warn/[0.05]',
    pulse: 'animate-[sleepy-breathe_4s_ease-in-out_infinite]',
  },
  'is-idle': {
    dot: 'bg-ink-400 shadow-[0_0_0_1px_var(--chrome-line-2),0_0_4px_0_var(--chrome-line)]',
    text: 'text-ink-300',
    ring: 'border-chrome-line-2 bg-surface-700/40',
    pulse: 'animate-[sleepy-breathe_6s_ease-in-out_infinite]',
  },
}

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
  const statusTone: StatusTone = runtimeRefreshing
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

  const tone = statusToneStyles[statusTone]

  return (
    <header
      className="min-w-0 grid grid-cols-[80px_minmax(260px,1fr)_minmax(360px,auto)] max-[980px]:grid-cols-[80px_minmax(180px,1fr)_auto] max-[820px]:grid-cols-1 items-center gap-5 max-[820px]:gap-2 px-4 max-[820px]:px-3 py-0 max-[820px]:py-2.5 border-b border-chrome-line bg-surface-850/80 backdrop-blur-sm"
      style={{ WebkitAppRegion: 'drag' } as CSSProperties}
      onDoubleClick={() => window.electronAPI?.windowToggleMaximize()}
    >
      <div className="w-[80px] h-[1px] max-[820px]:hidden" aria-hidden="true" />

      <div className="min-w-0 flex items-center justify-center max-[820px]:justify-start max-[820px]:flex-wrap gap-2.5">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...defaultSpring, delay: 0.05 }}
          className="flex items-center"
        >
          <Mark />
        </motion.div>
        <span className="text-ink-100 font-display text-[14px] font-medium tracking-[-0.01em]">
          lazy prompter<span className="text-accent-400">.</span>
        </span>
        {showRuntimeMeta && (
          <>
            <span className="w-px h-3 flex-none bg-chrome-line" />
            <span className="min-w-0 overflow-hidden text-ink-400 font-mono text-[11px] whitespace-nowrap text-ellipsis max-[980px]:hidden">{selectorValue || runtimeMeta}</span>
          </>
        )}
        <span className="flex-none text-ink-400/70 min-w-0 overflow-hidden font-mono text-[11px] whitespace-nowrap text-ellipsis max-[980px]:hidden">local only</span>
      </div>

      <div className="min-w-0 flex items-center justify-end max-[820px]:justify-start max-[820px]:flex-wrap gap-2" style={{ WebkitAppRegion: 'no-drag' } as CSSProperties}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={statusTone}
            layout
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            transition={defaultSpring}
            className={`inline-flex items-center flex-none whitespace-nowrap gap-2 h-[24px] px-2.5 rounded-pill border ${tone.ring}`}
            aria-label={`Runtime status: ${statusLabel}`}
          >
            <span className={`w-[6px] h-[6px] flex-none rounded-full ${tone.dot} ${tone.pulse}`} />
            <span className={`font-mono text-[10.5px] tracking-[0.06em] uppercase ${tone.text}`}>{statusContext}</span>
          </motion.div>
        </AnimatePresence>

        <label className="sr-only" htmlFor="model-selector">Model selector</label>
        <select
          id="model-selector"
          aria-label="Current local model"
          value={selectorValue}
          onChange={(event) => selectModel(event.target.value || null)}
          disabled={runtimeRefreshing || models.length === 0}
          className="w-auto min-w-[190px] max-[980px]:min-w-[170px] max-w-[280px] max-[980px]:max-w-[210px] max-[760px]:min-w-0 max-[760px]:flex-1 h-[26px] px-2.5 font-mono text-[11px] text-ink-200 bg-surface-750 border border-chrome-line-2 rounded-lg transition-[box-shadow,border-color] duration-140 hover:border-chrome-line-3 focus-visible:outline-none focus-visible:border-accent-500/60 focus-visible:shadow-focus-amber disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
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

        <motion.button
          type="button"
          onClick={() => void refreshRuntime()}
          whileTap={{ scale: 0.92 }}
          transition={pressSpring}
          className="inline-flex items-center justify-center flex-none w-[26px] h-[26px] rounded-lg text-ink-300 bg-transparent border border-chrome-line-2 transition-colors duration-140 hover:text-ink-100 hover:bg-surface-700 hover:border-chrome-line-3 disabled:opacity-45 focus-visible:outline-none focus-visible:shadow-focus-amber"
          aria-label="Refresh local runtime"
          disabled={runtimeRefreshing}
        >
          <RefreshCw size={13} strokeWidth={2.25} className={runtimeRefreshing ? 'animate-spin' : ''} />
        </motion.button>
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
