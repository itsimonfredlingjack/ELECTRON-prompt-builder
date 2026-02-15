import { useState, useEffect } from 'react'
import { useApp } from '@/contexts/AppContext'

export function TitleBar() {
  const { zaiConnected } = useApp()
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    window.electronAPI?.windowIsMaximized().then(setIsMaximized)
    const unsubscribe = window.electronAPI?.onWindowStateChange((state) => {
      setIsMaximized(state.isMaximized)
    })
    return () => unsubscribe?.()
  }, [])

  const getStatusColor = () => {
    if (zaiConnected === null) return 'bg-ghost-dim'
    return zaiConnected ? 'bg-signal-success' : 'bg-signal-warning'
  }

  const getStatusText = () => {
    if (zaiConnected === null) return 'Checking...'
    return zaiConnected ? 'Z.AI: Connected' : 'Z.AI: Configure API key'
  }

  return (
    <div
      className="flex items-center justify-between h-11 px-4 select-none bg-void border-b border-void-border"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      onDoubleClick={() => window.electronAPI?.windowToggleMaximize()}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 flex items-center justify-center rounded-lg surface">
          <svg className="w-4 h-4 text-ghost-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="text-xs font-medium text-ghost tracking-tight">AI Prompt Builder</span>
      </div>

      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg surface"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          <span className="text-xs text-ghost-muted">{getStatusText()}</span>
        </div>

        <div
          className="flex items-center gap-0.5"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            onClick={() => window.electronAPI?.windowMinimize()}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-ghost-muted hover:text-ghost surface"
            title="Minimize"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>

          <button
            onClick={() => window.electronAPI?.windowToggleMaximize()}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-ghost-muted hover:text-ghost surface"
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="7" width="12" height="12" rx="2" strokeWidth={2} />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7V5a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2h-2" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="5" y="5" width="14" height="14" rx="2" strokeWidth={2} />
              </svg>
            )}
          </button>

          <button
            onClick={() => window.electronAPI?.windowClose()}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-ghost-muted hover:text-signal-error surface hover:border-signal-error/50 hover:bg-signal-error/5"
            title="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
