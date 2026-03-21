import type { UploadStatus } from '@/types'

interface StatusRowProps {
  isStreaming: boolean
  isGenerating: boolean
  error: string | null
  uploadStatus: UploadStatus
  uploadProgress: number
  activeModelLabel: string
}

export function StatusRow({
  isStreaming,
  isGenerating,
  error,
  uploadStatus,
  uploadProgress,
  activeModelLabel,
}: StatusRowProps) {
  if (error) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs bg-void border border-void-border border-l-4 border-l-signal-error">
        <svg className="w-5 h-5 flex-shrink-0 text-signal-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-signal-error whitespace-pre-line">{error}</span>
      </div>
    )
  }

  if (uploadStatus === 'uploading' || uploadStatus === 'analyzing' || isStreaming || isGenerating) {
    const label =
      uploadStatus === 'uploading'
        ? 'Preparing image...'
        : uploadStatus === 'analyzing' || isStreaming
          ? `Rewriting with ${activeModelLabel}...`
          : `Connecting to local ${activeModelLabel}...`

    return (
      <div className="flex flex-col gap-2 px-3 py-2.5 rounded-lg text-xs bg-void border border-void-border">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-ghost-bright">{label}</span>
          <span className="ml-auto text-ghost-muted">{Math.max(0, Math.min(100, Math.round(uploadProgress)))}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-void-border overflow-hidden">
          <div className="h-full bg-accent transition-all duration-300" style={{ width: `${Math.max(6, uploadProgress)}%` }} />
        </div>
      </div>
    )
  }

  return null
}
