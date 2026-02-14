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
        className="w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
        </svg>
        Stop
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      Generate Prompt
    </button>
  )
}
