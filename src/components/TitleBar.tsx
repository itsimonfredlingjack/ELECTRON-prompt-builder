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
      className="flex items-center justify-between h-11 px-4 select-none"
      style={{
        WebkitAppRegion: 'drag',
        background: '#fff0f5',
        borderBottom: '1px solid #e8d8e6',
      } as React.CSSProperties}
      onDoubleClick={() => window.electronAPI?.windowToggleMaximize()}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 clay-node flex items-center justify-center">
          <svg className="w-4 h-4 text-ghost" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="text-xs font-medium text-ghost-bright tracking-wide">AI Prompt Builder</span>
      </div>

      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-void-border bg-white/35 shadow-clay-sm"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          <span className="text-xs text-ghost">{getStatusText()}</span>
        </div>

        <div
          className="flex items-center gap-0.5"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            onClick={() => window.electronAPI?.windowMinimize()}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-ghost hover:text-ghost-bright bg-white/30 hover:bg-white/55 border border-transparent hover:border-void-border-bright transition-all duration-200 ease-out active:scale-95 shadow-clay-sm"
            title="Minimize"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>

          <button
            onClick={() => window.electronAPI?.windowToggleMaximize()}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-ghost hover:text-ghost-bright bg-white/30 hover:bg-white/55 border border-transparent hover:border-void-border-bright transition-all duration-200 ease-out active:scale-95 shadow-clay-sm"
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
            className="w-9 h-9 flex items-center justify-center rounded-lg text-ghost hover:text-signal-error bg-white/30 hover:bg-signal-error/15 border border-transparent hover:border-signal-error/40 transition-all duration-200 active:scale-95 shadow-clay-sm"
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
