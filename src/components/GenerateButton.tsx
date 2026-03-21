interface GenerateButtonProps {
  onClick: () => void
  onRegenerate: () => void
  onStop: () => void
  isStreaming: boolean
  disabled: boolean
  showRegenerate: boolean
}

export function GenerateButton({
  onClick,
  onRegenerate,
  onStop,
  isStreaming,
  disabled,
  showRegenerate,
}: GenerateButtonProps) {
  if (isStreaming) {
    return (
      <button
        onClick={onStop}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-signal-error rounded-lg bg-void border border-signal-error/20 hover:bg-signal-error/5 transition-colors duration-200"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="6" width="12" height="12" rx="1" strokeWidth={2} />
        </svg>
        Stop Generation
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {showRegenerate ? (
        <div className="grid grid-cols-1 sm:grid-cols-[auto_minmax(0,1fr)] gap-2">
          <button
            type="button"
            onClick={onRegenerate}
            disabled={disabled}
            className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium rounded-lg border bg-void-light text-ghost-muted border-void-border hover:text-ghost hover:bg-void transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M5 9a7 7 0 0112.65-3.65L20 8M4 16l2.35 2.35A7 7 0 0019 15" />
            </svg>
            Regenerate
          </button>
          <PrimaryGenerateButton onClick={onClick} disabled={disabled} />
        </div>
      ) : (
        <PrimaryGenerateButton onClick={onClick} disabled={disabled} />
      )}
    </div>
  )
}

interface PrimaryGenerateButtonProps {
  onClick: () => void
  disabled: boolean
}

function PrimaryGenerateButton({ onClick, disabled }: PrimaryGenerateButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group relative overflow-hidden w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed btn-primary hover:shadow-lg hover:-translate-y-0.5"
      title="Generate prompt (Cmd/Ctrl+Enter)"
    >
      <span className="relative z-10 flex items-center gap-2">
        <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Generate Prompt
        <span className="hidden sm:inline-flex items-center rounded border border-white/20 px-1.5 py-0.5 text-[10px] text-white/80">
          Cmd/Ctrl+Enter
        </span>
      </span>
      <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent z-0" />
    </button>
  )
}
