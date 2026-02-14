export function TitleBar() {
  const handleMinimize = () => {
    window.electronAPI?.windowMinimize()
  }

  const handleMaximize = () => {
    window.electronAPI?.windowMaximize()
  }

  const handleClose = () => {
    window.electronAPI?.windowClose()
  }

  return (
    <div 
      className="flex items-center justify-between h-11 px-4 glass border-b border-glass-border select-none"
      style={{ 
        WebkitAppRegion: 'drag',
        borderRadius: '12px 12px 0 0'
      } as React.CSSProperties}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-neon-cyan/30 to-neon-magenta/30 border border-neon-cyan/40 flex items-center justify-center shadow-glow-cyan-sm">
          <svg className="w-4 h-4 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="text-sm font-medium text-ghost tracking-wide">AI Prompt Builder</span>
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
          onClick={handleMaximize}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-ghost-muted hover:text-ghost hover:bg-glass-hover transition-all"
          title="Maximize"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="5" y="5" width="14" height="14" rx="2" strokeWidth={2} />
          </svg>
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
  )
}
