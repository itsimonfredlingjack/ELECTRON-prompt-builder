import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { useApp } from '@/contexts/AppContext'
import { formatBytes, getModelCapability, validateSelectedImage } from '@/lib/zai'
import type { AppError } from '@/types'

function fileToBase64(file: File): Promise<string> {
  return file.arrayBuffer().then((buffer) => {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (const byte of bytes) binary += String.fromCharCode(byte)
    return btoa(binary)
  })
}

export function InputArea() {
  const { state, setState } = useApp()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const promptRef = useRef<HTMLTextAreaElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const selectedModel = useMemo(
    () => getModelCapability(state.model),
    [state.model],
  )

  useEffect(() => {
    return () => {
      if (state.imageAttachment?.previewUrl) {
        URL.revokeObjectURL(state.imageAttachment.previewUrl)
      }
    }
  }, [state.imageAttachment])

  useEffect(() => {
    promptRef.current?.focus()
  }, [])

  const openFilePicker = () => {
    if (!state.isGenerating) {
      inputRef.current?.click()
    }
  }

  const handleFile = async (file: File) => {
    const validationError = validateSelectedImage(file, state.model)
    if (validationError) {
      setState((prev) => ({
        ...prev,
        uploadStatus: 'error',
        uploadProgress: 0,
        uploadError: validationError,
      }))
      return
    }

    const previousAttachment = state.imageAttachment
    if (previousAttachment?.tempId) {
      void window.electronAPI.clearPreparedImage(previousAttachment.tempId)
    }
    if (previousAttachment?.previewUrl) {
      URL.revokeObjectURL(previousAttachment.previewUrl)
    }

    const previewUrl = URL.createObjectURL(file)
    setState((prev) => ({
      ...prev,
      imageAttachment: {
        name: file.name,
        size: file.size,
        mimeType: file.type,
        previewUrl,
        tempId: null,
        prepared: false,
      },
      uploadStatus: 'validating',
      uploadProgress: 15,
      uploadError: null,
      error: null,
    }))

    try {
      setState((prev) => ({ ...prev, uploadStatus: 'uploading', uploadProgress: 35 }))
      const dataBase64 = await fileToBase64(file)
      setState((prev) => ({ ...prev, uploadProgress: 60 }))
      const prepared = await window.electronAPI.prepareImageUpload({
        name: file.name,
        type: file.type,
        size: file.size,
        dataBase64,
      })

      setState((prev) => ({
        ...prev,
        imageAttachment: prev.imageAttachment
          ? {
              ...prev.imageAttachment,
              tempId: prepared.tempId,
              prepared: true,
              mimeType: prepared.mimeType,
              size: prepared.size,
            }
          : prev.imageAttachment,
        uploadStatus: 'ready',
        uploadProgress: 100,
      }))
    } catch (error) {
      const uploadError = normalizeUploadError(error)
      setState((prev) => ({
        ...prev,
        imageAttachment: prev.imageAttachment
          ? {
              ...prev.imageAttachment,
              tempId: null,
              prepared: false,
            }
          : null,
        uploadStatus: 'error',
        uploadProgress: 0,
        uploadError,
      }))
    }
  }

  const handleRemove = () => {
    if (state.imageAttachment?.tempId) {
      void window.electronAPI.clearPreparedImage(state.imageAttachment.tempId)
    }
    if (state.imageAttachment?.previewUrl) {
      URL.revokeObjectURL(state.imageAttachment.previewUrl)
    }

    setState((prev) => ({
      ...prev,
      imageAttachment: null,
      uploadStatus: 'idle',
      uploadProgress: 0,
      uploadError: null,
    }))

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await handleFile(file)
    }
  }

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) {
      await handleFile(file)
    }
  }

  const showModelWarning = !!state.imageAttachment && !selectedModel?.supportsImages
  return (
    <div className="flex flex-col gap-3">
      <label className="section-label">Your rough prompt</label>
      <div className="relative">
        <textarea
          ref={promptRef}
          value={state.inputText}
          onChange={(e) => setState((prev) => ({ ...prev, inputText: e.target.value }))}
          disabled={state.isGenerating}
          placeholder="Write the rough prompt you would normally send to another AI. Keep it messy if you want."
          className="w-full h-32 md:h-36 px-3 py-2 text-sm font-sans text-ghost-bright bg-void border border-void-border rounded-lg resize-none placeholder:text-ghost-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 overflow-y-auto shadow-sm focus-ring"
        />
        {state.inputText.length > 0 && (
          <div className="absolute bottom-2.5 right-3 text-xs text-ghost-dim">{state.inputText.length} chars</div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => void handleInputChange(event)}
      />

      <div
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => void handleDrop(event)}
        className={`rounded-xl px-1.5 py-1.5 transition-all duration-200 ${
          state.imageAttachment ? 'w-full border border-dashed' : 'inline-flex self-start border border-transparent bg-transparent'
        } ${
          isDragging ? 'border-accent bg-accent/5' : state.imageAttachment ? 'border-void-border bg-void-light' : 'bg-transparent'
        }`}
      >
        <div className="flex items-center justify-start">
          <button
            type="button"
            onClick={openFilePicker}
            disabled={state.isGenerating}
            className="inline-flex items-center gap-2 px-2.5 py-1.5 text-[11px] font-medium rounded-lg surface hover:border-accent/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v12m0 0l-4-4m4 4l4-4M5 20h14" />
            </svg>
            Attach image
          </button>
        </div>

        {state.imageAttachment && (
          <div className="mt-5 rounded-xl border border-void-border bg-void p-3 cursor-default" onClick={(event) => event.stopPropagation()}>
            <div className="flex gap-3 items-start">
              <img
                src={state.imageAttachment.previewUrl}
                alt={state.imageAttachment.name}
                className="w-24 h-24 object-cover rounded-lg border border-void-border bg-black/10"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ghost-bright truncate">{state.imageAttachment.name}</p>
                    <p className="text-xs text-ghost-muted mt-1">
                      {state.imageAttachment.mimeType} · {formatBytes(state.imageAttachment.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleRemove()
                    }}
                    className="px-2.5 py-1.5 text-xs font-medium rounded-lg surface hover:border-signal-error/40 hover:bg-signal-error/5"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] text-ghost-muted mb-1">
                    <span>{uploadStatusLabel(state.uploadStatus)}</span>
                    <span>{Math.max(0, Math.min(100, Math.round(state.uploadProgress)))}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-void-border overflow-hidden">
                    <div className="h-full bg-accent transition-all duration-300" style={{ width: `${Math.max(6, state.uploadProgress)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showModelWarning && selectedModel && (
        <div className="px-3 py-2 rounded-lg text-xs border border-amber-300/40 bg-amber-500/10 text-amber-100">
          {selectedModel.label} does not support image analysis.
        </div>
      )}

      {state.uploadError && (
        <div className="px-3 py-2 rounded-lg text-xs border border-signal-error/40 bg-signal-error/10 text-signal-error">
          {state.uploadError.message}
        </div>
      )}

    </div>
  )
}

function uploadStatusLabel(status: string): string {
  switch (status) {
    case 'validating':
      return 'Validating image...'
    case 'ready':
      return 'Image ready'
    case 'uploading':
      return 'Preparing image...'
    case 'analyzing':
      return 'Generating prompt...'
    case 'error':
      return 'Upload blocked'
    default:
      return 'Waiting for image'
  }
}

function normalizeUploadError(error: unknown): AppError {
  if (typeof error === 'object' && error !== null && 'message' in error && 'code' in error) {
    return error as AppError
  }

  if (error instanceof Error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
    }
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'Unexpected upload error.',
  }
}
