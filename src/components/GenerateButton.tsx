interface GenerateButtonProps {
  onClick: () => void
  onStop: () => void
  isStreaming: boolean
  disabled: boolean
}

export function GenerateButton({ onClick, onStop, isStreaming, disabled }: GenerateButtonProps) {
  if (isStreaming) {
    return (
      <button
        onClick={onStop}
        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white rounded-xl transition-all"
        style={{
          background: 'linear-gradient(135deg, rgba(255,0,170,0.3) 0%, rgba(255,0,170,0.15) 100%)',
          border: '1px solid rgba(255,0,170,0.5)',
          boxShadow: '0 0 25px rgba(255,0,170,0.3), 0 0 50px rgba(255,0,170,0.15)'
        }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="6" width="12" height="12" rx="1" strokeWidth={2} />
        </svg>
        Stop Generation
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-void rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none"
      style={{
        background: disabled 
          ? 'rgba(255,255,255,0.1)' 
          : 'linear-gradient(135deg, #00f0ff 0%, #00c4cc 50%, #ff00aa 100%)',
        boxShadow: disabled 
          ? 'none' 
          : '0 0 30px rgba(0,240,255,0.4), 0 0 60px rgba(0,240,255,0.2)',
      }}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      Generate Prompt
    </button>
  )
}
