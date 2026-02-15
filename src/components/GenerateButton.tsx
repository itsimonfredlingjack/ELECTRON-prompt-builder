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
        className="w-full flex items-center justify-center gap-2 px-6 py-3 text-xs font-medium tracking-wide text-ghost-bright rounded-lg transition-all duration-200 bg-[linear-gradient(165deg,#ffe9bf_0%,#ffe3a6_100%)] border border-[#e5cf8f] shadow-clay-sm hover:translate-y-[-1px] active:scale-[0.98]"
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
      className="w-full flex items-center justify-center gap-2 px-6 py-3 text-xs font-medium tracking-wide rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed btn-primary"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      Generate Prompt
    </button>
  )
}
