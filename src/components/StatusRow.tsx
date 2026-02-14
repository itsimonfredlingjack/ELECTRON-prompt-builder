interface StatusRowProps {
  isStreaming: boolean
  isGenerating: boolean
  error: string | null
}

export function StatusRow({ isStreaming, isGenerating, error }: StatusRowProps) {
  if (error) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 text-sm bg-red-50 border border-red-200 rounded-lg text-red-700">
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{error}</span>
      </div>
    )
  }

  if (isStreaming || isGenerating) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 text-sm bg-primary-50 border border-primary-200 rounded-lg text-primary-700">
        <svg className="w-5 h-5 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>{isStreaming ? 'Generating prompt...' : 'Connecting to Ollama...'}</span>
      </div>
    )
  }

  return null
}
