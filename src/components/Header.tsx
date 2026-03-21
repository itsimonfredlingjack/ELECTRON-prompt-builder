import { useMemo } from 'react'
import { useApp } from '@/contexts/AppContext'

interface HeaderProps {
  onRefresh: () => void
  compact: boolean
}

export function Header({ onRefresh, compact }: HeaderProps) {
  const { state, setState, ollamaConnected } = useApp()
  const isLoading = ollamaConnected === null
  const selectedModel = useMemo(
    () => state.modelCapabilities.find((model) => model.id === state.model),
    [state.modelCapabilities, state.model],
  )

  return (
    <div
      className={`sticky top-0 z-50 glass-header -mx-6 px-6 flex items-center justify-between transition-all duration-300 ${
        compact ? 'py-2.5 mb-3' : 'py-4 mb-6'
      }`}
    >
      <div className={`flex items-center transition-all duration-300 ${compact ? 'gap-2' : 'gap-3'}`}>
        <div
          className={`flex items-center justify-center rounded-lg surface transition-all duration-300 ${
            compact ? 'w-8 h-8' : 'w-10 h-10'
          }`}
        >
          <svg className="w-4 h-4 text-ghost-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h1 className={`font-semibold text-ghost tracking-tight transition-all duration-300 ${compact ? 'text-sm' : 'text-base'}`}>
            AI Prompt Builder
          </h1>
          {selectedModel && (
            <p
              className={`text-[11px] text-ghost-muted transition-all duration-300 ${
                compact ? 'opacity-0 max-h-0 overflow-hidden mt-0' : 'opacity-100 max-h-6 mt-1'
              }`}
            >
              No prompt storage · Local Ollama · {selectedModel.supportsImages ? 'Images supported' : 'Text only'}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <select
            value={state.model}
            onChange={(e) => setState((prev) => ({ ...prev, model: e.target.value }))}
            className={`appearance-none pl-3 pr-9 text-xs font-medium text-ghost-bright bg-void border border-void-border rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200 ${
              compact ? 'py-1.5' : 'py-2'
            }`}
          >
            {state.modelCapabilities.length === 0 && <option value="">No models</option>}
            {state.modelCapabilities.map((model) => (
              <option key={model.id} value={model.id} className="bg-void text-ghost-bright">
                {model.label}
              </option>
            ))}
          </select>
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ghost-muted pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className={`flex items-center justify-center text-ghost-muted hover:text-ghost rounded-lg surface disabled:opacity-50 transition-all duration-200 ${
            compact ? 'w-8 h-8' : 'w-9 h-9'
          }`}
          title="Verify connection"
        >
          <svg className={`w-5 h-5 ${isLoading ? 'animate-spin text-accent' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
