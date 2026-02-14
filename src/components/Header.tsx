import { SetAppState } from '@/types'

interface HeaderProps {
  models: string[]
  model: string
  setAppState: SetAppState
  onRefresh: () => void
  isLoading: boolean
}

export function Header({ models, model, setAppState, onRefresh, isLoading }: HeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-magenta/20 border border-neon-cyan/30 flex items-center justify-center shadow-glow-cyan-sm">
          <svg className="w-5 h-5 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-xl font-display font-semibold text-ghost tracking-wide">
          AI Prompt Builder
        </h1>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="relative">
          <select
            value={model}
            onChange={(e) => setAppState(prev => ({ ...prev, model: e.target.value }))}
            className="appearance-none pl-4 pr-10 py-2 text-sm font-medium text-ghost bg-glass-light border border-glass-border rounded-pill cursor-pointer focus:outline-none focus:border-neon-cyan/50 focus:shadow-glow-cyan-sm transition-all hover:bg-glass-hover"
          >
            {models.length === 0 && (
              <option value="">No models</option>
            )}
            {models.map((m) => (
              <option key={m} value={m} className="bg-void-light text-ghost">{m}</option>
            ))}
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ghost-muted pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="w-10 h-10 flex items-center justify-center text-ghost-muted hover:text-neon-cyan hover:bg-glass-hover rounded-full transition-all disabled:opacity-50"
          title="Refresh models"
        >
          <svg 
            className={`w-5 h-5 ${isLoading ? 'animate-spin text-neon-cyan' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
  )
}
