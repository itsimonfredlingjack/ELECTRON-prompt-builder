import { useApp } from '@/contexts/AppContext'

interface HeaderProps {
  onOpenSettings: () => void
  onRefresh: () => void
}

export function Header({ onOpenSettings, onRefresh }: HeaderProps) {
  const { state, setState, zaiConnected } = useApp()
  const isLoading = zaiConnected === null

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 flex items-center justify-center rounded-lg surface">
          <svg className="w-4 h-4 text-ghost-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-sm font-semibold text-ghost tracking-tight">
          AI Prompt Builder
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <select
            value={state.model}
            onChange={(e) => setState((prev) => ({ ...prev, model: e.target.value }))}
            className="appearance-none pl-3 pr-9 py-2 text-xs font-medium text-ghost-bright bg-void border border-void-border rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors duration-200"
          >
            {state.models.length === 0 && <option value="">No models</option>}
            {state.models.map((m) => (
              <option key={m} value={m} className="bg-void text-ghost-bright">
                {m}
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
          onClick={onOpenSettings}
          className="w-9 h-9 flex items-center justify-center text-ghost-muted hover:text-ghost rounded-lg surface"
          title="Settings"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="w-9 h-9 flex items-center justify-center text-ghost-muted hover:text-ghost rounded-lg surface disabled:opacity-50"
          title="Verify connection"
        >
          <svg
            className={`w-5 h-5 ${isLoading ? 'animate-spin text-accent' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
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
