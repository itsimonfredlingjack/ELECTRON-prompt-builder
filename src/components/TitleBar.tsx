import { useState, useEffect } from 'react'

interface TitleBarProps {
  ollamaConnected: boolean | null
}

export function TitleBar({ ollamaConnected }: TitleBarProps) {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    window.electronAPI?.windowIsMaximized().then(setIsMaximized)
    
    const unsubscribe = window.electronAPI?.onWindowStateChange((state) => {
      setIsMaximized(state.isMaximized)
    })
    
    return () => unsubscribe?.()
  }, [])

  const handleMinimize = () => {
    window.electronAPI?.windowMinimize()
  }

  const handleToggleMaximize = () => {
    window.electronAPI?.windowToggleMaximize()
  }

  const handleClose = () => {
    window.electronAPI?.windowClose()
  }

  const handleDoubleClick = () => {
    window.electronAPI?.windowToggleMaximize()
  }

  const getStatusColor = () => {
    if (ollamaConnected === null) return 'bg-ghost-dim'
    return ollamaConnected ? 'bg-neon-green' : 'bg-neon-magenta'
  }

  const getStatusGlow = () => {
    if (ollamaConnected === null) return ''
    return ollamaConnected ? 'shadow-glow-green' : 'shadow-glow-magenta-sm'
  }

  const getStatusText = () => {
    if (ollamaConnected === null) return 'Checking...'
    return ollamaConnected ? 'Ollama: Connected' : 'Ollama: Offline'
  }

  return (
    <div 
      className="flex items-center justify-between h-11 px-4 select-none"
      style={{ 
        WebkitAppRegion: 'drag',
        background: 'rgba(10,10,15,0.95)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 1px 0 rgba(0,0,0,0.3), inset 0 -1px 0 rgba(255,255,255,0.02)'
      } as React.CSSProperties}
      onDoubleClick={handleDoubleClick}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-neon-cyan/30 to-neon-magenta/30 border border-neon-cyan/40 flex items-center justify-center shadow-glow-cyan-sm">
          <svg className="w-4 h-4 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="text-sm font-medium text-ghost tracking-wide">AI Prompt Builder</span>
      </div>

      <div className="flex items-center gap-3">
        <div 
          className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-glass-light border border-glass-border"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${getStatusGlow()}`} />
          <span className="text-xs text-ghost-muted">{getStatusText()}</span>
        </div>

        <div 
          className="flex items-center gap-0.5"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            onClick={handleMinimize}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-ghost-muted hover:text-ghost hover:bg-glass-hover transition-all"
            title="Minimize"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>

          <button
            onClick={handleToggleMaximize}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-ghost-muted hover:text-ghost hover:bg-glass-hover transition-all"
            title={isMaximized ? "Restore" : "Maximize"}
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
            onClick={handleClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-ghost-muted hover:text-neon-magenta hover:bg-neon-magenta/10 transition-all"
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
